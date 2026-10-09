import { test as base, expect, type Locator, type Page } from "@playwright/test";
import {
  findScenario,
  formatVerdict,
  judgeUiOutcome,
  repoRoot,
  visionJudgeAvailable,
} from "../src/evaluators/ui_judge.js";

export type ToolCall = { toolName: string; args: Record<string, unknown> };

// Signs in through the login API and seeds the session before any page script runs,
// so tests start on protected pages without going through the login form.
export async function signIn(page: Page) {
  const response = await page.request.post("/api/login", {
    data: {
      username: process.env.DEMO_USERNAME ?? "demo",
      password: process.env.DEMO_PASSWORD ?? "demo123",
    },
  });
  expect(response.ok(), "demo login should succeed").toBeTruthy();
  const { user } = await response.json();
  await page.addInitScript((session) => {
    if (!sessionStorage.getItem("session")) sessionStorage.setItem("session", session);
  }, JSON.stringify(user));
}

export class ChatPage {
  readonly input: Locator;
  readonly sendButton: Locator;
  readonly responses: Locator;

  constructor(readonly page: Page) {
    this.input = page.locator('[data-testid="chat-input"]');
    this.sendButton = page.locator('[data-testid="send-button"]');
    this.responses = page.locator('[data-testid="chatbot-response"]');
  }

  async goto() {
    await signIn(this.page);
    await this.page.goto("/chat.html");
    await this.input.waitFor({ state: "visible" });
  }

  async send(prompt: string) {
    await this.input.fill(prompt);
    await this.sendButton.click();
  }

  // Waits for the latest response bubble and returns its text
  async lastResponseText(timeout = 15000) {
    const bubble = this.responses.last();
    await expect(bubble).toBeVisible({ timeout });
    return bubble.innerText();
  }
}

export class MockAgent {
  toolCalls: ToolCall[] = [];

  constructor(private readonly page: Page) {}

  // Intercepts the agent API and fulfills it with the given reply/tool calls
  async respondWith(reply: string, toolCalls: ToolCall[] = []) {
    this.toolCalls = toolCalls;
    await this.page.route("**/api/agent/run*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply, toolCalls })
      })
    );
  }
}

export const test = base.extend<{ chatPage: ChatPage; mockAgent: MockAgent; uiJudge: void }>({
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
  mockAgent: async ({ page }, use) => {
    await use(new MockAgent(page));
  },

  // With UI_JUDGE=1, an independent LLM judge reviews the final page of every test generated
  // from a plan (files with a `// spec:` comment) and attaches its verdict to the report.
  // If the judge finds a contradiction in a test whose own assertions passed, the test fails.
  // Opt a test out with: test.info().annotations.push({ type: "ui-judge", description: "skip: <reason>" })
  uiJudge: [
    async ({ page }, use, testInfo) => {
      await use();
      if (process.env.UI_JUDGE !== "1") return;

      // A test can opt out with a reason, e.g. when its final step runs in another browser context
      if (testInfo.annotations.some((a) => a.type === "ui-judge" && a.description?.startsWith("skip"))) return;
      const scenario = await findScenario(testInfo.file, testInfo.title, repoRoot(testInfo.config.configFile));
      if (!scenario) return;
      if (!visionJudgeAvailable()) {
        testInfo.annotations.push({ type: "ui-judge", description: "skipped: needs ANTHROPIC_API_KEY or OPENAI_API_KEY" });
        return;
      }

      let verdict;
      try {
        verdict = await judgeUiOutcome({
          scenario: scenario.text,
          finalStep: scenario.finalStep,
          url: page.url(),
          ariaSnapshot: await page.locator("body").ariaSnapshot(),
          screenshot: await page.screenshot({ fullPage: true }),
        });
      } catch (error) {
        testInfo.annotations.push({ type: "ui-judge", description: `error: ${(error as Error).message}` });
        return;
      }

      const report = formatVerdict(verdict);
      await testInfo.attach("ui-judge-verdict", { body: report, contentType: "text/plain" });
      testInfo.annotations.push({ type: "ui-judge", description: `${verdict.verdict}: ${verdict.summary}` });
      if (verdict.verdict === "FAIL" && testInfo.status === "passed") {
        throw new Error(`The test's assertions passed, but the independent UI judge disagrees.\n\n${report}`);
      }
    },
    { auto: true },
  ],
});

export { expect };
