import { normalizeCommitSha } from "./review-identity";

interface ExpectedReviewSnapshot {
  baseSha: string;
  headSha: string;
}

interface CurrentPullRequestSnapshot {
  base: {
    sha: string;
  };
  head: {
    sha: string;
  };
}

export function matchesReviewSnapshot(
  expected: ExpectedReviewSnapshot,
  current: CurrentPullRequestSnapshot,
): boolean {
  const expectedBase = normalizeCommitSha(expected.baseSha);
  const expectedHead = normalizeCommitSha(expected.headSha);

  const currentBase = normalizeCommitSha(current.base.sha);
  const currentHead = normalizeCommitSha(current.head.sha);

  return (
    expectedBase.length > 0 &&
    expectedHead.length > 0 &&
    expectedBase === currentBase &&
    expectedHead === currentHead
  );
}