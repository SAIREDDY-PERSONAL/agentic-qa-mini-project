import { test, expect } from "../fixtures.js";
import { judgeChatbotResponse } from "../../src/evaluators/llm_judge.js";
import { loadEvalDataset } from "../../src/data/eval_dataset.js";

const dataset = loadEvalDataset();
// LIVE_AGENT=1 sends each prompt to the real agent instead of the case's mockReply / mockToolCalls,
// so the judge grades what the agent actually says (npm run test:chatbot:live)
const live = process.env.LIVE_AGENT === "1";

test.describe("Agentic HCM Chatbot - Batch Evaluation Suite", { tag: "@chat-agent" }, () => {
  // An invalid dataset fails this suite only, before any (paid) judge call
  if (dataset.error) {
    test("eval_dataset.json is valid", () => {
      throw new Error(dataset.error);
    });
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
    test(`[${tc.id}] ${tc.category}`, details, async ({ chatPage, mockAgent }) => {
      let liveCalls: Promise<void> | undefined;
      if (live) {
        liveCalls = mockAgent.recordLiveCalls();
      } else {
        await mockAgent.respondWith(
          tc.mockReply,
          tc.mockToolCalls ?? (tc.expectedTool !== "none"
            ? [{ toolName: tc.expectedTool, args: { employeeId: "1042" } }]
            : [])
        );
      }

      await chatPage.goto();
      await chatPage.send(tc.prompt);
      const chatbotResponseText = await chatPage.lastResponseText();
      await liveCalls;
      const interceptedToolCalls = mockAgent.toolCalls;

      // Tool assertion
      if (tc.expectedTool !== "none") {
        expect(interceptedToolCalls).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ toolName: tc.expectedTool })
          ])
        );
      }

      // LLM Judge Evaluation
      const evalResult = await judgeChatbotResponse({
        userPrompt: tc.prompt,
        context: tc.context,
        interceptedToolCalls,
        chatbotResponseText,
      });

      // The schema asks for 0-10. (A former 0-1 rescaling turned a 1/10 into a passing 10/10.)
      const score = evalResult.score;

      console.log(`\n--- [${tc.id}] Evaluation Report ---`);
      console.log(`Score: ${score}/10 | Grounded: ${evalResult.isGrounded} | Helpful: ${evalResult.isHelpful}`);
      console.log(`Reasoning: ${evalResult.reasoning}\n`);

      if (tc.expectGrounded) {
        expect(evalResult.isGrounded).toBe(true);
      }
      expect(score).toBeGreaterThanOrEqual(tc.minScore);
    });
  }
});