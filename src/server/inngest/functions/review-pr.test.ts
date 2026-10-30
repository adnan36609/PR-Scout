import { beforeEach, describe, expect, it, vi } from "vitest";
import { InngestTestEngine } from "@inngest/test";

const mocks = vi.hoisted(() => ({
  updateReviewMany: vi.fn(),
  findReviewUnique: vi.fn(),
  findRepositoryUnique: vi.fn(),
  fetchPullRequest: vi.fn(),
  fetchPullRequestFiles: vi.fn(),
  getGitHubAccessToken: vi.fn(),
  reviewCode: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    review: {
      updateMany: mocks.updateReviewMany,
      findUnique: mocks.findReviewUnique,
    },
    repository: {
      findUnique: mocks.findRepositoryUnique,
    },
  },
}));

vi.mock("@/server/services/github", () => ({
  fetchPullRequest: mocks.fetchPullRequest,
  fetchPullRequestFiles: mocks.fetchPullRequestFiles,
  getGitHubAccessToken: mocks.getGitHubAccessToken,
}));

vi.mock("@/server/services/ai", () => ({
  reviewCode: mocks.reviewCode,
}));

import { reviewPR } from "./review-pr";

const REVIEW_ID = "review_123";
const REPOSITORY_ID = "repo_123";
const PR_NUMBER = 2;
const USER_ID = "user_123";

const BASE_SHA = "base123";
const HEAD_SHA = "head456";

const SNAPSHOT_CHANGED_ERROR =
  "The pull request changed after this review was queued. Trigger a new review for the latest commits.";

const expectedSnapshot = {
  baseSha: BASE_SHA,
  headSha: HEAD_SHA,
  prTitle: "Saved PR title",
};

const pullRequestSnapshot = (
  baseSha = BASE_SHA,
  headSha = HEAD_SHA,
) => ({
  base: { sha: baseSha },
  head: { sha: headSha },
});

const changedFiles = [
  {
    filename: "src/calculator.ts",
    status: "modified",
    additions: 3,
    deletions: 1,
    patch: "@@ -1,2 +1,4 @@",
  },
];

const reviewResult = {
  summary: "Potential calculation issue found.",
  riskScore: 35,
  comments: [],
};

async function executeReview() {
  const engine = new InngestTestEngine({
    function: reviewPR,
  });

  return engine.execute({
    events: [
      {
        name: "review/pr.requested",
        data: {
          reviewId: REVIEW_ID,
          repositoryId: REPOSITORY_ID,
          prNumber: PR_NUMBER,
          userId: USER_ID,
        },
      },
    ],
  });
}

function expectReviewFailedForChangedSnapshot() {
  expect(mocks.updateReviewMany).toHaveBeenLastCalledWith(
    expect.objectContaining({
      where: {
        id: REVIEW_ID,
        status: "PROCESSING",
      },
      data: expect.objectContaining({
        status: "FAILED",
        error: SNAPSHOT_CHANGED_ERROR,
        activeKey: null,
      }),
    }),
  );

  expect(mocks.reviewCode).not.toHaveBeenCalled();
}

describe("reviewPR Inngest function", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.updateReviewMany.mockResolvedValue({ count: 1 });

    mocks.findRepositoryUnique.mockResolvedValue({
      id: REPOSITORY_ID,
      fullName: "owner/repo",
    });

    mocks.getGitHubAccessToken.mockResolvedValue("github-test-token");

    mocks.findReviewUnique
      .mockResolvedValueOnce(expectedSnapshot)
      .mockResolvedValueOnce({ status: "PROCESSING" });

    mocks.fetchPullRequest.mockResolvedValue(pullRequestSnapshot());

    mocks.fetchPullRequestFiles.mockResolvedValue(changedFiles);

    mocks.reviewCode.mockResolvedValue(reviewResult);
  });

  it("rejects a changed head SHA before fetching PR files", async () => {
    mocks.fetchPullRequest.mockResolvedValueOnce(
      pullRequestSnapshot(BASE_SHA, "new-head"),
    );

    const { result } = await executeReview();

    expect(result).toEqual({
      success: false,
      error: SNAPSHOT_CHANGED_ERROR,
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(1);
    expect(mocks.fetchPullRequestFiles).not.toHaveBeenCalled();

    expectReviewFailedForChangedSnapshot();
  });

  it("rejects a changed base SHA before fetching PR files", async () => {
    mocks.fetchPullRequest.mockResolvedValueOnce(
      pullRequestSnapshot("new-base", HEAD_SHA),
    );

    const { result } = await executeReview();

    expect(result).toEqual({
      success: false,
      error: SNAPSHOT_CHANGED_ERROR,
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(1);
    expect(mocks.fetchPullRequestFiles).not.toHaveBeenCalled();

    expectReviewFailedForChangedSnapshot();
  });

  it("rejects a changed head SHA while fetching PR files", async () => {
    mocks.fetchPullRequest
      .mockResolvedValueOnce(pullRequestSnapshot())
      .mockResolvedValueOnce(
        pullRequestSnapshot(BASE_SHA, "new-head"),
      );

    const { result } = await executeReview();

    expect(result).toEqual({
      success: false,
      error: SNAPSHOT_CHANGED_ERROR,
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(2);
    expect(mocks.fetchPullRequestFiles).toHaveBeenCalledTimes(1);

    expectReviewFailedForChangedSnapshot();
  });

  it("rejects a changed base SHA while fetching PR files", async () => {
    mocks.fetchPullRequest
      .mockResolvedValueOnce(pullRequestSnapshot())
      .mockResolvedValueOnce(
        pullRequestSnapshot("new-base", HEAD_SHA),
      );

    const { result } = await executeReview();

    expect(result).toEqual({
      success: false,
      error: SNAPSHOT_CHANGED_ERROR,
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(2);
    expect(mocks.fetchPullRequestFiles).toHaveBeenCalledTimes(1);

    expectReviewFailedForChangedSnapshot();
  });

  it("reviews the saved PR snapshot when both SHAs remain unchanged", async () => {
    const { result } = await executeReview();

    expect(result).toEqual({
      success: true,
      reviewId: REVIEW_ID,
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(2);
    expect(mocks.fetchPullRequestFiles).toHaveBeenCalledTimes(1);

    expect(mocks.reviewCode).toHaveBeenCalledWith(
      expectedSnapshot.prTitle,
      changedFiles,
    );

    expect(mocks.updateReviewMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: REVIEW_ID,
          status: "PROCESSING",
        },
        data: expect.objectContaining({
          status: "COMPLETED",
          summary: reviewResult.summary,
          riskScore: reviewResult.riskScore,
          comments: reviewResult.comments,
          activeKey: null,
        }),
      }),
    );
  });

  it("does not invoke Gemini when the review has been cancelled", async () => {
    mocks.findReviewUnique
      .mockReset()
      .mockResolvedValueOnce(expectedSnapshot)
      .mockResolvedValueOnce({ status: "CANCELLED" });

    const { result } = await executeReview();

    expect(result).toEqual({
      success: false,
      error: "Review was cancelled before AI analysis started.",
    });

    expect(mocks.fetchPullRequest).toHaveBeenCalledTimes(2);
    expect(mocks.fetchPullRequestFiles).toHaveBeenCalledTimes(1);
    expect(mocks.reviewCode).not.toHaveBeenCalled();
  });
});