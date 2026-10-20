import { z } from "zod";
import rawDataset from "./eval_dataset.json" with { type: "json" };
import { checkToolCalls } from "../evaluators/tool_checks.js";

const ToolCallSchema = z.strictObject({
  toolName: z.string().min(1),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
});

// A message sent before the final prompt in a multi-turn case, with the answer the mock gives to it
const EarlierTurnSchema = z.strictObject({
  prompt: z.string().min(1),
  mockReply: z.string().min(1),
  mockToolCalls: z.array(ToolCallSchema).optional(),
});

// Strict objects, so a misspelt field (e.g. "minscore") fails here instead of being silently ignored
export const EvalCaseSchema = z.strictObject({
  id: z.string().regex(/^TC_\d{3,}$/, 'Use the form "TC_001"'),
  category: z.string().min(1),
  // Optional: the conversation before the final prompt. The checks and the judge grade the final answer.
  earlierTurns: z.array(EarlierTurnSchema).min(1).optional(),
  prompt: z.string().min(1),
  context: z.string().min(1),
  // A tool the agent must call, or "none" when it must not call any tool
  expectedTool: z.string().min(1),
  // Optional, see src/evaluators/tool_checks.ts: arguments expectedTool must get,
  // tools that must be called in this order, and tools that must not be called
  expectedArgs: z.record(z.string(), z.unknown()).optional(),
  toolOrder: z.array(z.string().min(1)).min(2).optional(),
  forbiddenTools: z.array(z.string().min(1)).min(1).optional(),
  // Optional, see src/evaluators/state_checks.ts: what the HR system must hold after the
  // conversation. Checked in live mode only, because the mock never reaches the HR system.
  expectedState: z
    .strictObject({
      balanceDays: z.number().min(0).optional(),
      requestCount: z.number().int().min(0).optional(),
      lastRequest: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  // Defaults to a single call of expectedTool when omitted
  mockToolCalls: z.array(ToolCallSchema).optional(),
  mockReply: z.string().min(1),
  // Optional: break part of the system for this case, to test how the agent copes.
  // "hr-down" makes the HR system's tools return an error (live mode; in mock mode the
  // mockToolCalls show the error instead).
  simulateFailure: z.enum(["hr-down"]).optional(),
  minScore: z.number().min(0).max(10),
  expectGrounded: z.boolean(),
  // With EVAL_RUNS > 1: the share of runs that must pass (overrides EVAL_MIN_PASS_RATE), and the
  // largest allowed gap between the highest and lowest judge score across the runs
  minPassRate: z.number().gt(0).max(1).optional(),
  maxScoreSpread: z.number().min(0).max(10).optional(),
  // Extra Playwright tags for this case, on top of @chat-agent, e.g. ["@happy-path"]
  tags: z.array(z.string().regex(/^@[A-Za-z0-9_-]+$/, 'Tags look like "@happy-path"')).optional(),
});

export type EvalCase = z.infer<typeof EvalCaseSchema>;

export const EvalDatasetSchema = z
  .array(EvalCaseSchema)
  .min(1)
  .superRefine((cases, ctx) => {
    const seen = new Set<string>();
    cases.forEach((tc, index) => {
      // Two cases with the same id would show up as one test title
      if (seen.has(tc.id)) {
        ctx.addIssue({ code: "custom", path: [index, "id"], message: `Duplicate id ${tc.id}` });
      }
      seen.add(tc.id);

      // The case's own mocked tool calls must pass its tool checks, or the data has a mistake
      if (tc.mockToolCalls) {
        for (const problem of checkToolCalls(tc, tc.mockToolCalls)) {
          ctx.addIssue({ code: "custom", path: [index, "mockToolCalls"], message: `${tc.id}: ${problem}` });
        }
      }
    });
  });

// Returns the error instead of throwing: a throw while a spec file loads would stop every
// Playwright run, including the smoke and UI tests, not just the chatbot suite
export function loadEvalDataset(): { cases: EvalCase[]; error?: string } {
  const parsed = EvalDatasetSchema.safeParse(rawDataset);
  if (!parsed.success) {
    return { cases: [], error: `src/data/eval_dataset.json is invalid:\n${z.prettifyError(parsed.error)}` };
  }
  return { cases: parsed.data };
}
