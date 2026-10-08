import { test as base, expect, type Locator, type Page } from "@playwright/test";

export type ToolCall = { toolName: string; args: Record<string, unknown> };

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
    await this.page.goto("/");
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

export const test = base.extend<{ chatPage: ChatPage; mockAgent: MockAgent }>({
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
  mockAgent: async ({ page }, use) => {
    await use(new MockAgent(page));
  },
});

export { expect };
