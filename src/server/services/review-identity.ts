export function normalizeCommitSha(sha: string): string {
  return sha.trim().toLowerCase();
}

export function buildActiveReviewKey(
  repositoryId: string,
  prNumber: number,
  baseSha: string,
  headSha: string,
): string {
  const normalizedBaseSha = normalizeCommitSha(baseSha);
  const normalizedHeadSha = normalizeCommitSha(headSha);

  if (!normalizedBaseSha || !normalizedHeadSha) {
    throw new Error("Base and head commit SHAs are required.");
  }

  return `${repositoryId}:${prNumber}:${normalizedBaseSha}:${normalizedHeadSha}`;
}