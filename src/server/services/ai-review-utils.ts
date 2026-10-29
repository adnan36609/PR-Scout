export type ReviewCommentInput = {
  file: string;
  line: number;
  severity: "critical" | "high" | "medium" | "low";
  category: "bug" | "security" | "performance" | "style" | "suggestion";
  message: string;
  suggestion?: string;
};

export interface ReviewFileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export function calculateRiskScore(
  comments: ReviewCommentInput[],
): number {
  if (comments.length === 0) {
    return 0;
  }

  const severityScores: Record<ReviewCommentInput["severity"], number> = {
    critical: 90,
    high: 60,
    medium: 35,
    low: 10,
  };

  const highestSeverityScore = Math.max(
    ...comments.map((comment) => severityScores[comment.severity]),
  );

  const additionalFindingAdjustment = Math.min(
    20,
    (comments.length - 1) * 5,
  );

  return Math.min(100, highestSeverityScore + additionalFindingAdjustment);
}

export function getAddedLineNumbers(patch: string): Set<number> {
  const addedLines = new Set<number>();

  let newLineNumber = 0;
  let insideHunk = false;

  for (const line of patch.split(/\r?\n/)) {
    const hunkMatch = line.match(
      /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/,
    );

    if (hunkMatch) {
      newLineNumber = Number(hunkMatch[1]);
      insideHunk = true;
      continue;
    }

    if (line.startsWith("diff --git ")) {
      insideHunk = false;
      continue;
    }

    if (!insideHunk) {
      continue;
    }

    if (line.startsWith("+")) {
      addedLines.add(newLineNumber);
      newLineNumber++;
    } else if (line.startsWith("-")) {
      // Removed lines do not advance the new-file line number.
      continue;
    } else if (line.startsWith(" ")) {
      newLineNumber++;
    }
  }

  return addedLines;
}

export function getAddedLinesWithText(
  patch: string,
): Array<{ line: number; text: string }> {
  const addedLines: Array<{ line: number; text: string }> = [];

  let newLineNumber = 0;
  let insideHunk = false;

  for (const line of patch.split(/\r?\n/)) {
    const hunkMatch = line.match(
      /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/,
    );

    if (hunkMatch) {
      newLineNumber = Number(hunkMatch[1]);
      insideHunk = true;
      continue;
    }

    if (line.startsWith("diff --git ")) {
      insideHunk = false;
      continue;
    }

    if (!insideHunk) {
      continue;
    }

    if (line.startsWith("+")) {
      addedLines.push({
        line: newLineNumber,
        text: line.slice(1),
      });

      newLineNumber++;
    } else if (line.startsWith("-")) {
      continue;
    } else if (line.startsWith(" ")) {
      newLineNumber++;
    }
  }

  return addedLines;
}

export function validateReviewComments(
  comments: ReviewCommentInput[],
  files: ReviewFileChange[],
): {
  comments: ReviewCommentInput[];
  rejectedCount: number;
} {
  const addedLinesByFile = new Map<string, Set<number>>();

  for (const file of files) {
    if (file.patch) {
      addedLinesByFile.set(
        file.filename,
        getAddedLineNumbers(file.patch),
      );
    }
  }

  const validComments: ReviewCommentInput[] = [];
  let rejectedCount = 0;

  for (const comment of comments) {
    const addedLines = addedLinesByFile.get(comment.file);

    if (addedLines?.has(comment.line)) {
      validComments.push(comment);
      continue;
    }

    rejectedCount++;

    console.warn("[PR Scout] Rejected AI finding location", {
      reportedFile: comment.file,
      reportedLine: comment.line,
      knownFiles: [...addedLinesByFile.keys()],
      changedLinesForReportedFile: addedLines
        ? [...addedLines].sort((a, b) => a - b)
        : null,
    });
  }

  return {
    comments: validComments,
    rejectedCount,
  };
}

export function deduplicateOverlappingFindings(
  comments: ReviewCommentInput[],
): {
  comments: ReviewCommentInput[];
  removedCount: number;
} {
  const duplicateDeclarationPattern =
    /\b(duplicate|duplicated|redeclared|redeclaration|redeclarations|redefined|redefinition|redefine|redundant|shadow(?:s|ed|ing)?|naming collision|same name|overrides? the first|overwrites? the first)\b/i;

  const concreteLogicPattern =
    /\b(incorrect|instead of|operator|return|addition|multiplication|subtraction|wrong result|logic|condition)\b/i;

  const removedIndexes = new Set<number>();

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const commentText = `${comment.message} ${comment.suggestion ?? ""}`;

    if (!duplicateDeclarationPattern.test(commentText)) {
      continue;
    }

    const overlapsWithConcreteBug = comments.some((other, j) => {
      if (i === j || other.file !== comment.file) {
        return false;
      }

      if (Math.abs(other.line - comment.line) > 3) {
        return false;
      }

      const otherText = `${other.message} ${other.suggestion ?? ""}`;

      return (
        other.category === "bug" &&
        concreteLogicPattern.test(otherText)
      );
    });

    if (overlapsWithConcreteBug) {
      removedIndexes.add(i);
    }
  }

  return {
    comments: comments.filter((_, index) => !removedIndexes.has(index)),
    removedCount: removedIndexes.size,
  };
}

export function normalizeReviewSeverities(
  comments: ReviewCommentInput[],
): ReviewCommentInput[] {
  const criticalImpactPattern =
    /\b(data loss|data corruption|irreversible data|crash(?:es|ed|ing)?|production outage|remote code execution|arbitrary code execution|privilege escalation|authentication bypass|authorization bypass)\b/i;

  return comments.map((comment) => {
    if (comment.severity !== "critical") {
      return comment;
    }

    // Preserve critical security findings.
    if (comment.category === "security") {
      return comment;
    }

    const evidence = `${comment.message} ${comment.suggestion ?? ""}`;

    if (criticalImpactPattern.test(evidence)) {
      return comment;
    }

    return {
      ...comment,
      severity: "high",
    };
  });
}