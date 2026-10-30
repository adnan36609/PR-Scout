import { describe, expect, it } from "vitest";

import { matchesReviewSnapshot } from "./review-snapshot";

describe("matchesReviewSnapshot", () => {
  const expected = {
    baseSha: "base123",
    headSha: "head456",
  };

  const current = {
    base: { sha: "base123" },
    head: { sha: "head456" },
  };

  it("accepts an unchanged PR snapshot", () => {
    expect(matchesReviewSnapshot(expected, current)).toBe(true);
  });

  it("rejects a changed head commit", () => {
    expect(
      matchesReviewSnapshot(expected, {
        ...current,
        head: { sha: "new-head" },
      }),
    ).toBe(false);
  });

  it("rejects a changed base commit", () => {
    expect(
      matchesReviewSnapshot(expected, {
        ...current,
        base: { sha: "new-base" },
      }),
    ).toBe(false);
  });

  it("normalizes SHA casing and whitespace", () => {
    expect(
      matchesReviewSnapshot(
        { baseSha: " BASE123 ", headSha: " HEAD456 " },
        {
          base: { sha: "base123" },
          head: { sha: "head456" },
        },
      ),
    ).toBe(true);
  });
});