import { beforeEach, describe, expect, it, vi } from "vitest";

const { reviewCreate, reviewFindUnique, deliveryUpdate, inngestSend } =
  vi.hoisted(() => ({
    reviewCreate: vi.fn(),
    reviewFindUnique: vi.fn(),
    deliveryUpdate: vi.fn(),
    inngestSend: vi.fn(),
  }));

vi.mock("@/server/db", () => ({
  db: {
    review: {
      create: reviewCreate,
      findUnique: reviewFindUnique,
    },
    gitHubWebhookDelivery: {
      update: deliveryUpdate,
    },
  },
}));

vi.mock("@/server/inngest", () => ({
  inngest: {
    send: inngestSend,
  },
}));

import { queueReview } from "./review-queue";

const baseInput = {
  repositoryId: "repo_123",
  userId: "user_123",
  prNumber: 2,
  prTitle: "Test pull request",
  prUrl: "https://github.com/test/repo/pull/2",
  baseSha: "def789abc123",
  headSha: "abc123def456",
};

const expectedActiveKey =
  "repo_123:2:def789abc123:abc123def456";

function createReview(status: "PENDING" | "PROCESSING" = "PENDING") {
  return {
    id: "review_123",
    ...baseInput,
    activeKey: expectedActiveKey,
    status,
  };
}

describe("queueReview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    inngestSend.mockResolvedValue({});
    deliveryUpdate.mockResolvedValue({});
  });

  it("creates a new review and queues an Inngest event", async () => {
    reviewCreate.mockResolvedValue(createReview());

    const result = await queueReview(baseInput);

    expect(result).toEqual({
      reviewId: "review_123",
      created: true,
    });

    expect(reviewCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        repositoryId: baseInput.repositoryId,
        prNumber: baseInput.prNumber,
        baseSha: baseInput.baseSha,
        headSha: baseInput.headSha,
        activeKey: expectedActiveKey,
        status: "PENDING",
      }),
    });

    expect(inngestSend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "pr-scout-review-review_123",
        name: "review/pr.requested",
      }),
    );
  });

  it("reuses an existing review after a unique-constraint conflict", async () => {
    reviewCreate.mockRejectedValue({ code: "P2002" });
    reviewFindUnique.mockResolvedValue(createReview());

    const result = await queueReview(baseInput);

    expect(result).toEqual({
      reviewId: "review_123",
      created: false,
    });

    expect(reviewFindUnique).toHaveBeenCalledWith({
      where: {
        activeKey: expectedActiveKey,
      },
    });

    expect(inngestSend).toHaveBeenCalledTimes(1);
  });

  it("does not queue another event for a processing review", async () => {
    reviewCreate.mockRejectedValue({ code: "P2002" });
    reviewFindUnique.mockResolvedValue(createReview("PROCESSING"));

    const result = await queueReview(baseInput);

    expect(result.created).toBe(false);
    expect(result.reviewId).toBe("review_123");
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("preserves the pending review when Inngest enqueueing fails", async () => {
    reviewCreate.mockResolvedValue(createReview());
    inngestSend.mockRejectedValue(
      new Error("Inngest temporarily unavailable"),
    );

    await expect(queueReview(baseInput)).rejects.toThrow(
      "Inngest temporarily unavailable",
    );

    expect(reviewCreate).toHaveBeenCalledTimes(1);
    expect(inngestSend).toHaveBeenCalledTimes(1);
  });

  it("associates a recovered review with its GitHub delivery", async () => {
    reviewFindUnique.mockResolvedValue(createReview());

    const result = await queueReview({
      ...baseInput,
      deliveryId: "github_delivery_123",
      existingReviewId: "review_123",
    });

    expect(result).toEqual({
      reviewId: "review_123",
      created: false,
    });

    expect(deliveryUpdate).toHaveBeenCalledWith({
      where: {
        deliveryId: "github_delivery_123",
      },
      data: {
        reviewId: "review_123",
      },
    });

    expect(inngestSend).toHaveBeenCalledTimes(1);
  });

  it("rejects a recovered review belonging to a different head commit", async () => {
    reviewFindUnique.mockResolvedValue({
      ...createReview(),
      headSha: "different_head_sha",
    });

    await expect(
      queueReview({
        ...baseInput,
        existingReviewId: "review_123",
      }),
    ).rejects.toThrow(
      "Previously associated review does not match the PR snapshot.",
    );

    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("rejects a recovered review belonging to a different base commit", async () => {
    reviewFindUnique.mockResolvedValue({
      ...createReview(),
      baseSha: "different_base_sha",
    });

    await expect(
      queueReview({
        ...baseInput,
        existingReviewId: "review_123",
      }),
    ).rejects.toThrow(
      "Previously associated review does not match the PR snapshot.",
    );

    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("handles concurrent requests for the same PR snapshot without creating duplicate reviews", async () => {
    const review = createReview();

    // One request creates the review; the other encounters
    // the database's unique activeKey constraint.
    reviewCreate
      .mockResolvedValueOnce(review)
      .mockRejectedValueOnce({ code: "P2002" });

    reviewFindUnique.mockResolvedValue(review);

    const results = await Promise.all([
      queueReview({
        ...baseInput,
        deliveryId: "delivery_concurrent_1",
      }),
      queueReview({
        ...baseInput,
        deliveryId: "delivery_concurrent_2",
      }),
    ]);

    expect(results).toEqual([
      {
        reviewId: "review_123",
        created: true,
      },
      {
        reviewId: "review_123",
        created: false,
      },
    ]);

    expect(reviewCreate).toHaveBeenCalledTimes(2);

    // Both requests use the same stable Inngest event ID.
    expect(inngestSend).toHaveBeenCalledTimes(2);

    const eventIds = inngestSend.mock.calls.map(([event]) => event.id);

    expect(eventIds).toEqual([
      "pr-scout-review-review_123",
      "pr-scout-review-review_123",
    ]);

    expect(deliveryUpdate).toHaveBeenCalledTimes(2);
  });
});