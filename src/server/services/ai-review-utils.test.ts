import { afterEach, describe, expect, it, vi } from "vitest";

import {
  calculateRiskScore,
  deduplicateOverlappingFindings,
  getAddedLineNumbers,
  getAddedLinesWithText,
  normalizeReviewSeverities,
  validateReviewComments,
  type ReviewCommentInput,
  type ReviewFileChange,
} from "./ai-review-utils";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeComment(
  overrides: Partial<ReviewCommentInput> = {},
): ReviewCommentInput {
  return {
    file: "src/calculator.js",
    line: 2,
    severity: "high",
    category: "bug",
    message: "The addition operator produces the wrong result.",
    suggestion: "Use multiplication instead.",
    ...overrides,
  };
}

const calculatorPatch = [
  "@@ -1,3 +1,3 @@",
  " function multiply(a, b) {",
  "-  return a * b;",
  "+  return a + b;",
  " }",
].join("\n");

const calculatorFile: ReviewFileChange = {
  filename: "src/calculator.js",
  status: "modified",
  additions: 1,
  deletions: 1,
  patch: calculatorPatch,
};

describe("getAddedLineNumbers", () => {
  it("identifies added lines using new-file line numbers", () => {
    expect(getAddedLineNumbers(calculatorPatch)).toEqual(new Set([2]));
  });

  it("handles multiple hunks", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      " const a = 1;",
      "-const b = 2;",
      "+const b = 3;",
      "@@ -10,2 +10,3 @@",
      " const c = 4;",
      "+const d = 5;",
      " const e = 6;",
    ].join("\n");

    expect(getAddedLineNumbers(patch)).toEqual(new Set([2, 11]));
  });

  it("handles file boundaries and resets line numbers for each file", () => {
    const patch = [
      "diff --git a/src/a.js b/src/a.js",
      "index 111..222 100644",
      "--- a/src/a.js",
      "+++ b/src/a.js",
      "@@ -4,3 +4,4 @@",
      " const first = 1;",
      "-const oldValue = 2;",
      "+const newValue = 2;",
      "+const anotherValue = 3;",
      " const last = 4;",
      "diff --git a/src/b.js b/src/b.js",
      "index 333..444 100644",
      "--- a/src/b.js",
      "+++ b/src/b.js",
      "@@ -8 +8 @@",
      "-const oldValue = 1;",
      "+const newValue = 1;",
    ].join("\n");

    expect(getAddedLineNumbers(patch)).toEqual(new Set([5, 6, 8]));
  });
});

describe("getAddedLinesWithText", () => {
  it("returns each added line with its line number and text", () => {
    expect(getAddedLinesWithText(calculatorPatch)).toEqual([
      {
        line: 2,
        text: "  return a + b;",
      },
    ]);
  });
  it("preserves exact text and line numbers for consecutive additions", () => {
    const patch = [
      "@@ -10,3 +10,4 @@",
      " const before = true;",
      "-const oldValue = 1;",
      "+  const newValue = 2;",
      "+  const extra = 3;",
      " const after = true;",
    ].join("\n");

    expect(getAddedLinesWithText(patch)).toEqual([
      { line: 11, text: "  const newValue = 2;" },
      { line: 12, text: "  const extra = 3;" },
    ]);
  });
});

describe("validateReviewComments", () => {
  it("accepts findings on added lines and rejects invalid locations", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const validFinding = makeComment({ line: 2 });
    const unchangedLineFinding = makeComment({ line: 1 });
    const unknownFileFinding = makeComment({
      file: "src/missing.js",
      line: 2,
    });

    const result = validateReviewComments(
      [validFinding, unchangedLineFinding, unknownFileFinding],
      [calculatorFile],
    );

    expect(result.comments).toEqual([validFinding]);
    expect(result.rejectedCount).toBe(2);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it("rejects findings when a file has no patch", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const fileWithoutPatch: ReviewFileChange = {
      filename: "src/calculator.js",
      status: "modified",
      additions: 1,
      deletions: 0,
    };

    const result = validateReviewComments([makeComment()], [fileWithoutPatch]);

    expect(result.comments).toEqual([]);
    expect(result.rejectedCount).toBe(1);
  });

  it("validates findings independently for different files", () => {
    const firstFile: ReviewFileChange = {
      filename: "src/first.js",
      status: "modified",
      additions: 1,
      deletions: 1,
      patch: "@@ -1 +1 @@\n-old\n+new",
    };

    const secondFile: ReviewFileChange = {
      filename: "src/second.js",
      status: "modified",
      additions: 1,
      deletions: 1,
      patch: "@@ -1 +1 @@\n-old\n+new",
    };

    const firstFinding = makeComment({
      file: "src/first.js",
      line: 1,
    });

    const secondFinding = makeComment({
      file: "src/second.js",
      line: 1,
    });

    const result = validateReviewComments(
      [firstFinding, secondFinding],
      [firstFile, secondFile],
    );

    expect(result.comments).toEqual([firstFinding, secondFinding]);
    expect(result.rejectedCount).toBe(0);
  });
});

describe("deduplicateOverlappingFindings", () => {
  it("removes overlapping declaration noise when a concrete bug exists", () => {
    const declarationFinding = makeComment({
      line: 1,
      message: "A redundant declaration creates a naming collision.",
    });

    const logicFinding = makeComment({
      line: 2,
      category: "bug",
      message:
        "The addition operator returns the wrong result instead of multiplying.",
      suggestion: "Use the multiplication operator.",
    });

    const result = deduplicateOverlappingFindings([
      declarationFinding,
      logicFinding,
    ]);

    expect(result.comments).toEqual([logicFinding]);
    expect(result.removedCount).toBe(1);
  });

  it("preserves declaration findings when no overlapping concrete bug exists", () => {
    const declarationFinding = makeComment({
      message: "This duplicate declaration should be reviewed.",
    });

    const result = deduplicateOverlappingFindings([declarationFinding]);

    expect(result.comments).toEqual([declarationFinding]);
    expect(result.removedCount).toBe(0);
  });

  it("does not merge findings that are far apart", () => {
    const declarationFinding = makeComment({
      line: 2,
      message: "This duplicate declaration should be reviewed.",
    });

    const logicFinding = makeComment({
      line: 10,
      message: "The operator produces the wrong result.",
    });

    const result = deduplicateOverlappingFindings([
      declarationFinding,
      logicFinding,
    ]);

    expect(result.comments).toHaveLength(2);
    expect(result.removedCount).toBe(0);
  });

  it("does not deduplicate findings across different files", () => {
    const declarationFinding = makeComment({
      file: "src/first.js",
      line: 1,
      message: "A duplicate declaration should be reviewed.",
    });

    const logicFinding = makeComment({
      file: "src/second.js",
      line: 2,
      category: "bug",
      message: "The operator produces the wrong result.",
    });

    const result = deduplicateOverlappingFindings([
      declarationFinding,
      logicFinding,
    ]);

    expect(result.comments).toEqual([declarationFinding, logicFinding]);
    expect(result.removedCount).toBe(0);
  });
});

describe("normalizeReviewSeverities", () => {
  it("downgrades an unsupported critical logic finding to high", () => {
    const finding = makeComment({
      severity: "critical",
      category: "bug",
      message: "The function returns the wrong result.",
    });

    expect(normalizeReviewSeverities([finding])[0].severity).toBe("high");
  });

  it("preserves critical severity when evidence indicates severe impact", () => {
    const finding = makeComment({
      severity: "critical",
      category: "bug",
      message: "This defect can cause irreversible data loss.",
    });

    expect(normalizeReviewSeverities([finding])[0].severity).toBe("critical");
  });

  it("preserves critical security findings", () => {
    const finding = makeComment({
      severity: "critical",
      category: "security",
      message: "User input is not validated.",
    });

    expect(normalizeReviewSeverities([finding])[0].severity).toBe("critical");
  });

  it("does not change findings that are not critical", () => {
    const finding = makeComment({ severity: "medium" });

    expect(normalizeReviewSeverities([finding])).toEqual([finding]);
  });
});

describe("calculateRiskScore", () => {
  it("returns zero for a review with no findings", () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it("scores a single high-severity finding as 60", () => {
    expect(calculateRiskScore([makeComment({ severity: "high" })])).toBe(60);
  });

  it("increases the score for additional findings", () => {
    expect(
      calculateRiskScore([
        makeComment({ severity: "high" }),
        makeComment({ severity: "high", line: 3 }),
      ]),
    ).toBe(65);
  });

  it("caps the score at 100", () => {
    expect(
      calculateRiskScore([
        makeComment({ severity: "critical" }),
        makeComment({ severity: "high", line: 3 }),
        makeComment({ severity: "high", line: 4 }),
      ]),
    ).toBe(100);
  });

  it("uses the configured base score for each severity", () => {
    expect(calculateRiskScore([makeComment({ severity: "critical" })])).toBe(
      90,
    );

    expect(calculateRiskScore([makeComment({ severity: "medium" })])).toBe(35);

    expect(calculateRiskScore([makeComment({ severity: "low" })])).toBe(10);
  });
});
