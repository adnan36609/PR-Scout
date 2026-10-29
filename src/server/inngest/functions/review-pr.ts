import { inngest } from "../client";
import { db } from "@/server/db";
import { reviewCode } from "@/server/services/ai";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
  };
};

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
        await db.review.updateMany({
          where: {
            id: reviewId,
            status: {
              in: ["PENDING", "PROCESSING"],
            },
          },
          data: {
            status: "FAILED",
            error:
              "The AI review could not be completed after multiple attempts. Please try again.",
          },
        });
      });
    },
  },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId } = event.data;

    // Only a pending review may enter processing.
    // This prevents a cancelled review from restarting.
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
        await db.review.updateMany({
          where: {
            id: reviewId,
            status: "PROCESSING",
          },
          data: {
            status: "FAILED",
            error: "No repository found",
          },
        });
      });

      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.review.updateMany({
          where: {
            id: reviewId,
            status: "PROCESSING",
          },
          data: {
            status: "FAILED",
            error: "GitHub access token not found",
          },
        });
      });

      return { success: false, error: "GitHub access token not found" };
    }

    const [owner, repo] = repository.fullName.split("/");

    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.review.updateMany({
          where: {
            id: reviewId,
            status: "PROCESSING",
          },
          data: {
            status: "FAILED",
            error: "Invalid repository name",
          },
        });
      });

      return { success: false, error: "Invalid repository name" };
    }

    const files = await step.run("fetch-pr-files", async () => {
      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
    });

    const pr = await step.run("fetch-pr", async () => {
      return fetchPullRequest(accessToken, owner, repo, prNumber);
    });

    const reviewResult = await step.run("generate-review", async () => {
      // Check that the review is still active before calling Gemini.
      const currentReview = await db.review.findUnique({
        where: { id: reviewId },
        select: { status: true },
      });

      if (currentReview?.status !== "PROCESSING") {
        return null;
      }

      return reviewCode(
        pr.title,
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

    // Only a processing review may be completed.
    // If cancellation won the race, the database update affects zero rows.
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
