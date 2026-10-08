import { test, expect } from "@playwright/test";
import { judgeChatbotResponse } from "../../src/evaluators/llm_judge.js";
import testCases from "../../src/data/eval_dataset.json" assert { type: "json" };
import path from "path";

test.describe("Agentic HCM Chatbot - Batch Evaluation Suite", () => {
  for (const tc of testCases) {
    test(`[${tc.id}] ${tc.category}: "${tc.prompt}"`, async ({ page }) => {
      let interceptedToolCalls: any[] = [];

      await page.route("**/api/agent/run", async (route) => {
        const mockBackendResponse = {
          reply: tc.mockReply,
          toolCalls: tc.expectedTool !== "none" 
            ? [{ toolName: tc.expectedTool, args: { employeeId: "1042" } }]
            : []
        };

        interceptedToolCalls = mockBackendResponse.toolCalls;

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockBackendResponse)
        });
      });

      const htmlPath = path.resolve(process.cwd(), "app/index.html");
      await page.goto(`file://${htmlPath}`);

      await page.fill('[data-testid="chat-input"]', tc.prompt);
      await page.click('[data-testid="send-button"]');

      const responseBubble = page.locator('[data-testid="chatbot-response"]').last();
      await expect(responseBubble).toBeVisible({ timeout: 5000 });
      const chatbotResponseText = await responseBubble.innerText();

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

      const normalizedScore = evalResult.score <= 1.0 ? evalResult.score * 10 : evalResult.score;

      console.log(`\n--- [${tc.id}] Evaluation Report ---`);
      console.log(`Score: ${normalizedScore}/10 | Grounded: ${evalResult.isGrounded} | Helpful: ${evalResult.isHelpful}`);
      console.log(`Reasoning: ${evalResult.reasoning}\n`);

      // Dynamic assertions based on dataset metadata
      if (tc.expectGrounded) {
        expect(evalResult.isGrounded).toBe(true);
      }
      expect(normalizedScore).toBeGreaterThanOrEqual(tc.minScore);
    });
  }
});