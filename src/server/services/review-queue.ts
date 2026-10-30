import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import {
  buildActiveReviewKey,
  normalizeCommitSha,
} from "./review-identity";

interface QueueReviewInput {
  repositoryId: string;
  userId: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  baseSha: string;
  headSha: string;
  deliveryId?: string;
  existingReviewId?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function queueReview(input: QueueReviewInput) {
  const baseSha = normalizeCommitSha(input.baseSha);
  const headSha = normalizeCommitSha(input.headSha);

  const activeKey = buildActiveReviewKey(
    input.repositoryId,
    input.prNumber,
    baseSha,
    headSha,
  );

  let review;
  let created = false;

  if (input.existingReviewId) {
    const existingReview = await db.review.findUnique({
      where: {
        id: input.existingReviewId,
      },
    });

    if (!existingReview) {
      throw new Error("Previously associated review was not found.");
    }

    if (
      existingReview.repositoryId !== input.repositoryId ||
      existingReview.prNumber !== input.prNumber ||
      normalizeCommitSha(existingReview.baseSha ?? "") !== baseSha ||
      normalizeCommitSha(existingReview.headSha ?? "") !== headSha
    ) {
      throw new Error(
        "Previously associated review does not match the PR snapshot.",
      );
    }

    review = existingReview;
  } else {
    try {
      review = await db.review.create({
        data: {
          repositoryId: input.repositoryId,
          userId: input.userId,
          prNumber: input.prNumber,
          prTitle: input.prTitle,
          prUrl: input.prUrl,
          baseSha,
          headSha,
          activeKey,
          status: "PENDING",
        },
      });

      created = true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existingReview = await db.review.findUnique({
        where: {
          activeKey,
        },
      });

      if (!existingReview) {
        throw error;
      }

      review = existingReview;
    }
  }

  if (input.deliveryId) {
    await db.gitHubWebhookDelivery.update({
      where: {
        deliveryId: input.deliveryId,
      },
      data: {
        reviewId: review.id,
      },
    });
  }

  if (review.status === "PENDING") {
    await inngest.send({
      id: `pr-scout-review-${review.id}`,
      name: "review/pr.requested",
      data: {
        reviewId: review.id,
        repositoryId: input.repositoryId,
        prNumber: input.prNumber,
        userId: input.userId,
      },
    });
  }

  return {
    reviewId: review.id,
    created,
  };
}