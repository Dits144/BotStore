function levenshtein(a = '', b = '') {
  const s = String(a);
  const t = String(b);
  const m = s.length;
  const n = t.length;
  if (!m) return n;
  if (!n) return m;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[m][n];
}

function similarity(a = '', b = '') {
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - (levenshtein(a, b) / maxLen);
}

function suggestClosest(input, candidates = [], limit = 3, minScore = 0.55) {
  const scored = candidates
    .map((name) => ({ name, score: similarity(input, name) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => x.name);
}

module.exports = { suggestClosest };
