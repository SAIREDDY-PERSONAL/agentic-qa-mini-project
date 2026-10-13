import { z } from "zod";
import rawDataset from "./eval_dataset.json" with { type: "json" };

const ToolCallSchema = z.strictObject({
  toolName: z.string().min(1),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
});

// Strict objects, so a misspelt field (e.g. "minscore") fails here instead of being silently ignored
export const EvalCaseSchema = z.strictObject({
  id: z.string().regex(/^TC_\d{3,}$/, 'Use the form "TC_001"'),
  category: z.string().min(1),
  prompt: z.string().min(1),
  context: z.string().min(1),
  // A tool the agent must call, or "none" when it must not need one
  expectedTool: z.string().min(1),
  // Defaults to a single call of expectedTool when omitted
  mockToolCalls: z.array(ToolCallSchema).optional(),
  mockReply: z.string().min(1),
  minScore: z.number().min(0).max(10),
  expectGrounded: z.boolean(),
  // Extra Playwright tags for this case, on top of @chat-agent, e.g. ["@happy-path"]
  tags: z
    .array(
      z
        .string()
        .regex(/^@[A-Za-z0-9_-]+$/, 'Tags look like "@happy-path"')
        // The smoke workflow runs without API keys, so a judged case would always fail there
        .refine((tag) => tag !== "@smoke", "Chatbot cases need an API key, so they can't be @smoke"),
    )
    .optional(),
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

      const mockedTools = tc.mockToolCalls?.map((call) => call.toolName);
      if (tc.expectedTool !== "none" && mockedTools && !mockedTools.includes(tc.expectedTool)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "mockToolCalls"],
          message: `${tc.id} expects ${tc.expectedTool}, but its mockToolCalls never call it`,
        });
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
