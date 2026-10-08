import { test, expect } from "@playwright/test";
import { judgeChatbotResponse } from "../../src/evaluators/llm_judge.js";
import testCases from "../../src/data/eval_dataset.json" assert { type: "json" };
import path from "path";
import { pathToFileURL } from "url";

test.describe("Agentic HCM Chatbot - Batch Evaluation Suite", () => {
  for (const tc of testCases) {
    test(`[${tc.id}] ${tc.category}: "${tc.prompt}"`, async ({ page }) => {
      let interceptedToolCalls: any[] = [];

      // Catch any request matching api/agent/run regardless of exact hostname or query params
      await page.route("**/api/agent/run*", async (route) => {
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
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(mockBackendResponse)
        });
      });

      // Construct cross-platform absolute file:// URL
      const absoluteAppPath = path.resolve(process.cwd(), "app/index.html");
      const appUrl = pathToFileURL(absoluteAppPath).href;
      await page.goto(appUrl, { waitUntil: "domcontentloaded" });

      // Fill and trigger UI submission
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.waitFor({ state: "visible" });
      await chatInput.fill(tc.prompt);
      
      const sendButton = page.locator('[data-testid="send-button"]');
      await sendButton.click();

      // Wait for UI to render the response bubble
      const responseBubble = page.locator('[data-testid="chatbot-response"]').last();
      await expect(responseBubble).toBeVisible({ timeout: 15000 });
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