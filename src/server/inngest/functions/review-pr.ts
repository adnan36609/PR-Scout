import { inngest } from "../client";
import { db } from "@/server/db";
import { reviewCode } from "@/server/services/ai";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { matchesReviewSnapshot } from "@/server/services/review-snapshot";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
  };
};

const SNAPSHOT_CHANGED_ERROR =
  "The pull request changed after this review was queued. Trigger a new review for the latest commits.";

async function markReviewFailed(reviewId: string, error: string) {
  return db.review.updateMany({
    where: {
      id: reviewId,
      status: "PROCESSING",
    },
    data: {
      status: "FAILED",
      error,
      activeKey: null,
    },
  });
}

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    triggers: { event: "review/pr.requested" },

    cancelOn: [
      {
        event: "review/pr.cancelled",
        if: "async.data.reviewId == event.data.reviewId",
      },
    ],

    onFailure: async ({ event, error, step }) => {
      const originalEvent = event.data.event as {
        data?: {
          reviewId?: string;
        };
      };

      const reviewId = originalEvent.data?.reviewId;

      if (!reviewId) {
        console.error(
          "Cannot identify the review after final failure.",
          error.message,
        );
        return;
      }

      console.error("PR review failed after retries", {
        reviewId,
        error: error.message,
      });

      await step.run("mark-review-failed-after-retries", async () => {
        await markReviewFailed(
          reviewId,
          "The AI review could not be completed after multiple attempts. Please try again.",
        );
      });
    },
  },

  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId } = event.data;

    const started = await step.run("update-status-processing", async () => {
      return db.review.updateMany({
        where: {
          id: reviewId,
          status: "PENDING",
        },
        data: {
          status: "PROCESSING",
          error: null,
        },
      });
    });

    if (started.count === 0) {
      return {
        success: false,
        error: "Review is no longer pending; it may have been cancelled.",
      };
    }

    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
      });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await markReviewFailed(reviewId, "No repository found");
      });

      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await markReviewFailed(
          reviewId,
          "GitHub access token not found",
        );
      });

      return {
        success: false,
        error: "GitHub access token not found",
      };
    }

    const [owner, repo] = repository.fullName.split("/");

    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await markReviewFailed(reviewId, "Invalid repository name");
      });

      return {
        success: false,
        error: "Invalid repository name",
      };
    }

    const reviewSnapshot = await step.run(
      "get-review-snapshot",
      async () => {
        return db.review.findUnique({
          where: { id: reviewId },
          select: {
            baseSha: true,
            headSha: true,
            prTitle: true,
          },
        });
      },
    );

    if (
      !reviewSnapshot?.baseSha ||
      !reviewSnapshot.headSha
    ) {
      const error =
        "The review is missing its original commit snapshot. Please trigger a new review.";

      await step.run("mark-failed-missing-snapshot", async () => {
        await markReviewFailed(reviewId, error);
      });

      return { success: false, error };
    }

    const expectedSnapshot = {
      baseSha: reviewSnapshot.baseSha,
      headSha: reviewSnapshot.headSha,
    };

    // First check: make sure the PR still matches the queued snapshot.
    const prBeforeFiles = await step.run(
      "fetch-pr-before-files",
      async () => {
        return fetchPullRequest(
          accessToken,
          owner,
          repo,
          prNumber,
        );
      },
    );

    if (!matchesReviewSnapshot(expectedSnapshot, prBeforeFiles)) {
      await step.run("mark-failed-stale-before-fetch", async () => {
        await markReviewFailed(reviewId, SNAPSHOT_CHANGED_ERROR);
      });

      return {
        success: false,
        error: SNAPSHOT_CHANGED_ERROR,
      };
    }

    // Fetch the changed files only after the first snapshot check.
    const files = await step.run("fetch-pr-files", async () => {
      return fetchPullRequestFiles(
        accessToken,
        owner,
        repo,
        prNumber,
      );
    });

    // Second check: detect changes that happened while files were fetched.
    const prAfterFiles = await step.run(
      "fetch-pr-after-files",
      async () => {
        return fetchPullRequest(
          accessToken,
          owner,
          repo,
          prNumber,
        );
      },
    );

    if (!matchesReviewSnapshot(expectedSnapshot, prAfterFiles)) {
      await step.run("mark-failed-stale-after-fetch", async () => {
        await markReviewFailed(reviewId, SNAPSHOT_CHANGED_ERROR);
      });

      return {
        success: false,
        error: SNAPSHOT_CHANGED_ERROR,
      };
    }

    const reviewResult = await step.run("generate-review", async () => {
      const currentReview = await db.review.findUnique({
        where: { id: reviewId },
        select: { status: true },
      });

      if (currentReview?.status !== "PROCESSING") {
        return null;
      }

      return reviewCode(
        reviewSnapshot.prTitle,
        files.map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
        })),
      );
    });

    if (!reviewResult) {
      return {
        success: false,
        error: "Review was cancelled before AI analysis started.",
      };
    }

    const saved = await step.run("save-review-result", async () => {
      return db.review.updateMany({
        where: {
          id: reviewId,
          status: "PROCESSING",
        },
        data: {
          status: "COMPLETED",
          summary: reviewResult.summary,
          riskScore: reviewResult.riskScore,
          comments: reviewResult.comments,
          error: null,
          activeKey: null,
        },
      });
    });

    if (saved.count === 0) {
      return {
        success: false,
        error: "Review was cancelled before its results could be saved.",
      };
    }

    return { success: true, reviewId };
  },
);