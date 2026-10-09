import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, judgeProvider } from "./llm_judge.js";

// Independent judge for UI tests: compares the page's final state (screenshot + accessibility
// snapshot) with the expected results in the test's plan. It never sees the test's own code
// or assertions, so it can catch a test that passes for the wrong reason.

// The model only reports per-expectation checks; the verdict is derived from them in code, so it can
// never disagree with the evidence (asking the model for both produced verdicts that contradicted its checks).
export const UiJudgeSchema = z.object({
  checks: z
    .array(
      z.object({
        expectation: z.string().describe("One expected result of the final step, quoted or closely paraphrased."),
        status: z
          .enum(["met", "contradicted", "not_verifiable"])
          .describe("not_verifiable only if the screenshot and snapshot cannot show it either way."),
        evidence: z.string().describe("What in the screenshot or snapshot supports this status."),
      }),
    )
    .describe("One entry per expected result of the final step."),
  summary: z.string().describe("One or two sentences summarising the checks."),
});

export type UiJudgeVerdict = z.infer<typeof UiJudgeSchema> & { verdict: "PASS" | "FAIL" | "INCONCLUSIVE" };

function deriveVerdict(checks: z.infer<typeof UiJudgeSchema>["checks"]): UiJudgeVerdict["verdict"] {
  if (checks.some((c) => c.status === "contradicted")) return "FAIL";
  if (checks.length > 0 && checks.every((c) => c.status === "met")) return "PASS";
  return "INCONCLUSIVE";
}

// Finds the scenario a test was generated from: the test file's `// spec: <plan>` comment names
// the plan, and the test title matches the scenario heading (`#### 1.2. <title>`).
// `finalStep` is the scenario's last numbered step: the final screenshot shows the state after it,
// so only its expectations are judged. Earlier steps are context, covered by the test's own assertions.
export async function findScenario(testFile: string, testTitle: string, rootDir: string) {
  const source = await readFile(testFile, "utf8");
  const planPath = source.match(/^\/\/ spec: (\S+)/m)?.[1];
  if (!planPath) return null;

  const plan = await readFile(resolve(rootDir, planPath), "utf8");
  const sections = plan.split(/^(?=#{3,4} )/m);
  const section = sections.find((s) => s.match(/^#### [\d.]+\s+(.+?)\s*$/m)?.[1] === testTitle);
  if (!section) return null;
  const lastStepAt = [...section.matchAll(/^ {2}\d+\. /gm)].at(-1)?.index;
  return {
    planPath,
    text: section.trim(),
    finalStep: lastStepAt === undefined ? section.trim() : section.slice(lastStepAt).trim(),
  };
}

export function visionJudgeAvailable() {
  // The local Ollama fallback (llama3.2) cannot read images
  return judgeProvider() !== "ollama";
}

let model: ReturnType<typeof buildModel> | undefined;
function buildModel() {
  return createChatModel().withStructuredOutput(UiJudgeSchema);
}

export async function judgeUiOutcome(params: {
  scenario: string;
  finalStep: string;
  url: string;
  ariaSnapshot: string;
  screenshot: Buffer;
}): Promise<UiJudgeVerdict> {
  model ??= buildModel();
  const instructions = `You are an independent QA judge for a web application's end-to-end tests.
A test has just finished. You are given the test scenario from the test plan, and the browser's FINAL state:
a screenshot, the page's accessibility snapshot, and the URL. You do not see the test code or its assertions.

The final state is the page right after the scenario's LAST step. Judge only that step's expected results
("expect:" lines), each separately. Earlier steps are context only: do not judge them, and do not treat their
expectations as contradicted because the final page no longer shows them.
- Treat contradictions strictly. For example, a success message is not enough if the page also shows
  that the saved item is missing (an empty list, an "empty" message, an unchanged count).
- Rely on the screenshot and snapshot only; do not assume anything that is not visible.

Full scenario, for context (from the test plan):
${params.scenario}

Final step to judge:
${params.finalStep}

Final URL: ${params.url}

Final accessibility snapshot:
${params.ariaSnapshot}`;

  const message = new HumanMessage({
    content: [
      { type: "text", text: instructions },
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.screenshot.toString("base64")}` } },
    ],
  });
  const result = await model.invoke([message]);
  return { ...result, verdict: deriveVerdict(result.checks) };
}

export function formatVerdict(v: UiJudgeVerdict) {
  const icon = { met: "✓", contradicted: "✗", not_verifiable: "–" } as const;
  const lines = v.checks.map((c) => `${icon[c.status]} ${c.expectation}\n    ${c.evidence}`);
  return `UI judge verdict: ${v.verdict}\n${v.summary}\n\n${lines.join("\n")}`;
}

export function repoRoot(configFile: string | undefined) {
  return configFile ? dirname(configFile) : process.cwd();
}
