import { describe, expect, it } from "vitest";

import { buildActiveReviewKey } from "./review-identity";

describe("buildActiveReviewKey", () => {
  const repositoryId = "repo_123";
  const prNumber = 2;
  const baseSha = "def789abc123";
  const headSha = "abc123def456";

  it("generates a deterministic key for the same PR snapshot", () => {
    expect(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, headSha),
    ).toBe(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, headSha),
    );
  });

  it("generates different keys for different head commits", () => {
    expect(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, headSha),
    ).not.toBe(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, "different-head"),
    );
  });

  it("generates different keys for different base commits", () => {
    expect(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, headSha),
    ).not.toBe(
      buildActiveReviewKey(repositoryId, prNumber, "different-base", headSha),
    );
  });

  it("generates different keys for different pull requests", () => {
    expect(
      buildActiveReviewKey(repositoryId, prNumber, baseSha, headSha),
    ).not.toBe(
      buildActiveReviewKey(repositoryId, 3, baseSha, headSha),
    );
  });

  it("normalizes SHA casing and whitespace", () => {
    expect(
      buildActiveReviewKey(repositoryId, prNumber, " DEF789 ", " ABC123 "),
    ).toBe(
      buildActiveReviewKey(repositoryId, prNumber, "def789", "abc123"),
    );
  });

  it("rejects missing commit SHAs", () => {
    expect(() =>
      buildActiveReviewKey(repositoryId, prNumber, "", headSha),
    ).toThrow("Base and head commit SHAs are required.");
  });
});