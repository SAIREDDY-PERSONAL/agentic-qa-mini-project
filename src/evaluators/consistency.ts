// Repeated runs: the agent and the judge can both answer differently each time,
// so each case runs several times and passes if enough of the runs pass.

export type RunResult = {
  run: number;
  tools: string; // the tools the agent called, in order
  problems: string[]; // what was wrong with the tool calls or the HR data (empty when all was fine)
  score: number;
  scoreDetail: string; // the judge's score per criterion, e.g. "accuracy 9, relevance 10, ..."
  isGrounded: boolean;
  hallucinations: string[]; // facts the judge says were made up
  reasoning: string;
  passed: boolean;
};

// EVAL_RUNS: how many times each case runs (default 1).
// EVAL_MIN_PASS_RATE: the share of runs that must pass (default 1, so every run).
export function readRunSettings(env = process.env) {
  const runs = Number(env.EVAL_RUNS ?? 1);
  const minPassRate = Number(env.EVAL_MIN_PASS_RATE ?? 1);

  let error: string | undefined;
  if (!Number.isInteger(runs) || runs < 1) {
    error = `EVAL_RUNS must be a whole number of at least 1, got "${env.EVAL_RUNS}"`;
  } else if (!(minPassRate > 0 && minPassRate <= 1)) {
    error = `EVAL_MIN_PASS_RATE must be above 0 and at most 1, got "${env.EVAL_MIN_PASS_RATE}"`;
  }
  return { runs, minPassRate, error };
}

export function summarizeRuns(results: RunResult[]) {
  const scores = results.map((r) => r.score);
  const passed = results.filter((r) => r.passed).length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  return {
    passed,
    passRate: passed / results.length,
    averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    minScore,
    maxScore,
    scoreSpread: maxScore - minScore,
  };
}

export function formatReport(results: RunResult[]): string {
  const s = summarizeRuns(results);
  const lines = [
    `Passed ${s.passed} of ${results.length} runs`,
    `Scores: average ${s.averageScore.toFixed(1)}, lowest ${s.minScore}, highest ${s.maxScore}`,
  ];
  for (const r of results) {
    lines.push(`Run ${r.run}: ${r.passed ? "PASS" : "FAIL"} | score ${r.score} | grounded ${r.isGrounded} | tools ${r.tools}`);
    lines.push(`  Scores: ${r.scoreDetail}`);
    for (const problem of r.problems) lines.push(`  Problem: ${problem}`);
    for (const fact of r.hallucinations) lines.push(`  Made-up fact: ${fact}`);
    lines.push(`  ${r.reasoning}`);
  }
  return lines.join("\n");
}
