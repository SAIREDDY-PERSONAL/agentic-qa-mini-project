import { test, expect } from "@playwright/test";
import { readRunSettings, summarizeRuns, type RunResult } from "../../src/evaluators/consistency.js";

// Unit tests for the repeated-run summary. No browser and no judge call, so no API key is needed.

function makeRun(run: number, score: number, passed: boolean): RunResult {
  return { run, tools: "check_leave_balance", problems: [], score, scoreDetail: "", isGrounded: passed, hallucinations: [], reasoning: "", passed };
}

test("summarizeRuns counts passes and score range", () => {
  const summary = summarizeRuns([makeRun(1, 8, true), makeRun(2, 6, false), makeRun(3, 10, true), makeRun(4, 8, true)]);

  expect(summary.passed).toBe(3);
  expect(summary.passRate).toBe(0.75);
  expect(summary.averageScore).toBe(8);
  expect(summary.minScore).toBe(6);
  expect(summary.maxScore).toBe(10);
  expect(summary.scoreSpread).toBe(4);
});

test("readRunSettings defaults to one run that must pass", () => {
  expect(readRunSettings({})).toEqual({ runs: 1, minPassRate: 1, error: undefined });
});

test("readRunSettings reads EVAL_RUNS and EVAL_MIN_PASS_RATE", () => {
  expect(readRunSettings({ EVAL_RUNS: "5", EVAL_MIN_PASS_RATE: "0.8" })).toEqual({ runs: 5, minPassRate: 0.8, error: undefined });
});

test("readRunSettings rejects bad values", () => {
  expect(readRunSettings({ EVAL_RUNS: "0" }).error).toContain("EVAL_RUNS");
  expect(readRunSettings({ EVAL_RUNS: "abc" }).error).toContain("EVAL_RUNS");
  expect(readRunSettings({ EVAL_MIN_PASS_RATE: "1.5" }).error).toContain("EVAL_MIN_PASS_RATE");
});
