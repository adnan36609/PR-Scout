import { describe, expect, it } from "vitest";

import { reviewCode } from "../src/server/services/ai";

const liveIt = process.env.GEMINI_API_KEY ? it : it.skip;

describe("Live AI review evaluations", () => {
  liveIt(
    "detects the multiplication bug on the exact changed line",
    async () => {
      const result = await reviewCode("Update calculator implementation", [
        {
          filename: "src/calculator.js",
          status: "modified",
          additions: 1,
          deletions: 1,
          patch: [
            "@@ -10,4 +10,4 @@",
            " // calculator implementation",
            " function multiply(a, b) {",
            "-  return a * b;",
            "+  return a + b;",
            " }",
          ].join("\n"),
        },
      ]);

      const finding = result.comments.find(
        (comment) =>
          comment.file === "src/calculator.js" &&
          comment.line === 12 &&
          comment.category === "bug",
      );

      expect(
        finding,
        `Expected a bug finding at src/calculator.js:12. Actual findings:\n${JSON.stringify(result.comments, null, 2)}`,
      ).toBeDefined();

      expect(finding?.message).toMatch(
        /multipli|addition|operator|wrong result|incorrect/i,
      );
    },
  );

  liveIt(
    "detects an incorrect age comparison on the changed line",
    async () => {
      const result = await reviewCode("Update age validation", [
        {
          filename: "src/validation.js",
          status: "modified",
          additions: 1,
          deletions: 1,
          patch: [
            "@@ -1,3 +1,3 @@",
            " function isAdult(age) {",
            "-  return age >= 18;",
            "+  return age > 18;",
            " }",
          ].join("\n"),
        },
      ]);

      const finding = result.comments.find(
        (comment) =>
          comment.file === "src/validation.js" &&
          comment.line === 2 &&
          comment.category === "bug",
      );

      expect(
        finding,
        `Expected a bug finding at src/validation.js:2. Actual findings:\n${JSON.stringify(result.comments, null, 2)}`,
      ).toBeDefined();

      expect(finding?.message).toMatch(
        /18|age|adult|boundary|comparison|operator/i,
      );
    },
  );

  liveIt("does not report a bug in a straightforward numeric helper", async () => {
    const result = await reviewCode("Add a numeric helper", [
      {
        filename: "src/math.ts",
        status: "added",
        additions: 3,
        deletions: 0,
        patch: [
          "@@ -0,0 +1,3 @@",
          "+export function double(value: number): number {",
          "+  return value * 2;",
          "+}",
        ].join("\n"),
      },
    ]);

    expect(
      result.comments,
      `Expected no findings for straightforward code. Actual findings:\n${JSON.stringify(result.comments, null, 2)}`,
    ).toEqual([]);
  });
});