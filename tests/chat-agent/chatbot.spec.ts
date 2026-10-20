import { test, expect, type ChatPage, type MockAgent } from "../fixtures.js";
import { judgeChatbotResponse } from "../../src/evaluators/llm_judge.js";
import { loadEvalDataset, type EvalCase } from "../../src/data/eval_dataset.js";
import { formatReport, readRunSettings, summarizeRuns, type RunResult } from "../../src/evaluators/consistency.js";
import { checkToolCalls } from "../../src/evaluators/tool_checks.js";
import { checkState } from "../../src/evaluators/state_checks.js";

const dataset = loadEvalDataset();
// LIVE_AGENT=1 sends each prompt to the real agent instead of the case's mockReply / mockToolCalls,
// so the judge grades what the agent actually says (npm run test:chatbot:live)
const live = process.env.LIVE_AGENT === "1";
// EVAL_RUNS=5 runs every case five times and passes it on its pass rate (npm run test:chatbot:repeat)
const settings = readRunSettings();

// Asks the chatbot one question. In live mode it also records the tools the agent used for it.
async function askAgent(prompt: string, chatPage: ChatPage, mockAgent: MockAgent) {
  const liveCalls = live ? mockAgent.recordLiveCalls() : undefined;
  const answer = await chatPage.ask(prompt);
  await liveCalls;
  return answer;
}

// One run: have the conversation, let the judge score the final answer, check the tools used
// for it and (in live mode) the HR system's data, and decide if this run passed
async function runOnce(tc: EvalCase, run: number, chatPage: ChatPage, mockAgent: MockAgent): Promise<RunResult> {
  // Opening the chat page again gives every run a new conversation
  await chatPage.goto();

  // Multi-turn cases: send the earlier messages first, and keep a copy for the judge
  const earlierConversation: string[] = [];
  for (const turn of tc.earlierTurns ?? []) {
    const answer = await askAgent(turn.prompt, chatPage, mockAgent);
    earlierConversation.push(`User: ${turn.prompt}`, `Assistant: ${answer}`);
  }

  // The final question is the one we grade. mockAgent.toolCalls now holds the tools used for it.
  const answer = await askAgent(tc.prompt, chatPage, mockAgent);

  const verdict = await judgeChatbotResponse({
    userPrompt: tc.prompt,
    context: tc.context,
    interceptedToolCalls: mockAgent.toolCalls,
    chatbotResponseText: answer,
    earlierConversation,
  });

  // Did the agent use the right tools? And in live mode: did the HR system really change?
  const problems = checkToolCalls(tc, mockAgent.toolCalls);
  if (live && tc.expectedState) {
    problems.push(...checkState(tc.expectedState, await mockAgent.readTimeOff()));
  }
  const scoreOk = verdict.score >= tc.minScore;
  const groundedOk = verdict.isGrounded || !tc.expectGrounded;

  return {
    run,
    tools: mockAgent.toolCalls.map((call) => call.toolName).join(" > ") || "none",
    problems,
    score: verdict.score,
    scoreDetail: `accuracy ${verdict.accuracy}, relevance ${verdict.relevance}, completeness ${verdict.completeness}, policy ${verdict.policy}`,
    isGrounded: verdict.isGrounded,
    hallucinations: verdict.hallucinations,
    reasoning: verdict.reasoning,
    passed: problems.length === 0 && scoreOk && groundedOk,
  };
}

test.describe("Agentic HCM Chatbot - Batch Evaluation Suite", { tag: "@chat-agent" }, () => {
  // An invalid dataset fails this suite only, before any (paid) judge call
  if (dataset.error) {
    test("eval_dataset.json is valid", () => {
      throw new Error(dataset.error);
    });
  }
  if (settings.error) {
    test("EVAL_RUNS and EVAL_MIN_PASS_RATE are valid", () => {
      throw new Error(settings.error);
    });
    return;
  }

  for (const tc of dataset.cases) {
    // The title is the id and category only, so editing a prompt keeps the test's history.
    // The prompt is shown as an annotation in the report instead.
    const details = {
      tag: tc.tags ?? [],
      annotation: [
        { type: "prompt", description: tc.prompt },
        { type: "agent", description: live ? "live" : "mocked" },
      ],
    };
    test(`[${tc.id}] ${tc.category}`, details, async ({ chatPage, mockAgent }, testInfo) => {
      // More runs take longer, so give the test more time
      test.setTimeout(testInfo.timeout * settings.runs);

      // 1. Failure cases: tell the server which part to break (it reads this header)
      if (tc.simulateFailure) {
        await chatPage.page.setExtraHTTPHeaders({ "x-simulate-failure": tc.simulateFailure });
      }

      //    Unless we're testing the real agent, make it return this case's prepared answers:
      //    one for each earlier turn, then the final one
      if (!live) {
        const finalToolCalls = tc.mockToolCalls ?? (tc.expectedTool !== "none"
          ? [{ toolName: tc.expectedTool, args: { employeeId: "1042" } }]
          : []);
        await mockAgent.respondWith([
          ...(tc.earlierTurns ?? []).map((turn) => ({ reply: turn.mockReply, toolCalls: turn.mockToolCalls ?? [] })),
          { reply: tc.mockReply, toolCalls: finalToolCalls },
        ]);
      }

      // 2. Run the case as many times as EVAL_RUNS says
      const results: RunResult[] = [];
      for (let run = 1; run <= settings.runs; run++) {
        results.push(await runOnce(tc, run, chatPage, mockAgent));
      }

      // 3. Show every run in the console and in the HTML report
      const report = formatReport(results);
      console.log(`\n--- [${tc.id}] Evaluation Report ---\n${report}\n`);
      await testInfo.attach("eval-runs", { body: report, contentType: "text/plain" });

      // 4. Pass the case if enough runs passed, and (optionally) if the scores stayed close together
      const summary = summarizeRuns(results);
      const minPassRate = tc.minPassRate ?? settings.minPassRate;
      expect(summary.passRate, `Too few runs passed\n\n${report}`).toBeGreaterThanOrEqual(minPassRate);

      if (tc.maxScoreSpread !== undefined) {
        expect(summary.scoreSpread, `Judge scores varied too much\n\n${report}`).toBeLessThanOrEqual(tc.maxScoreSpread);
      }
    });
  }
});
