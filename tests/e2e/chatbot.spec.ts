import { test, expect } from "../fixtures.js";
import { judgeChatbotResponse } from "../../src/evaluators/llm_judge.js";
import testCases from "../../src/data/eval_dataset.json" with { type: "json" };

test.describe("Agentic HCM Chatbot - Batch Evaluation Suite", () => {
  for (const tc of testCases) {
    test(`[${tc.id}] ${tc.category}: "${tc.prompt}"`, async ({ chatPage, mockAgent }) => {
      await mockAgent.respondWith(
        tc.mockReply,
        tc.mockToolCalls ?? (tc.expectedTool !== "none"
          ? [{ toolName: tc.expectedTool, args: { employeeId: "1042" } }]
          : [])
      );

      await chatPage.goto();
      await chatPage.send(tc.prompt);
      const chatbotResponseText = await chatPage.lastResponseText();
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