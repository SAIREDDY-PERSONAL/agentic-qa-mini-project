import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { z } from "zod";

// The demo portal's login, the same defaults as app/server.mjs
const demoCredentials = {
  username: process.env.DEMO_USERNAME ?? "demo",
  password: process.env.DEMO_PASSWORD ?? "demo123",
};

export type ToolCall = { toolName: string; args: Record<string, unknown>; result?: unknown };

// The contract of POST /api/agent/run, agreed with the agent's owners. A live run checks the real
// response against it: the reply's wording and the tools chosen vary, the shape must not.
export const AgentResponseSchema = z.object({
  reply: z.string().min(1),
  toolCalls: z.array(
    z.object({
      toolName: z.string().min(1),
      args: z.record(z.string(), z.unknown()),
      result: z.unknown().optional(),
    }),
  ),
});

// Signs in through the login API and seeds the session before any page script runs,
// so tests start on protected pages without going through the login form.
export async function signIn(page: Page) {
  const response = await page.request.post("/api/login", {
    data: demoCredentials,
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

  // Sends a question and returns the chatbot's answer. It waits for a new answer bubble,
  // so in a conversation it never returns the previous turn's answer.
  async ask(prompt: string, timeout = 15000) {
    const answersBefore = await this.responses.count();
    await this.input.fill(prompt);
    await this.sendButton.click();
    await expect(this.responses).toHaveCount(answersBefore + 1, { timeout });
    return this.responses.last().innerText();
  }
}

export type AgentTurn = { reply: string; toolCalls: ToolCall[] };

// The HR system's data for one conversation (GET /api/time-off/<conversationId>)
export type TimeOffState = {
  balanceDays: number;
  requests: { requestId: string; type: string; days: number; status: string }[];
};

export class MockAgent {
  toolCalls: ToolCall[] = [];
  conversationId?: string; // live mode: the chat page's id for the current conversation

  constructor(private readonly page: Page) {}

  // Intercepts the agent API and answers with the prepared turns: the first question gets
  // turns[0], the second gets turns[1], and so on. The turn number comes from the
  // conversation history the chat page sends, so every new conversation starts at turns[0].
  async respondWith(turns: AgentTurn[]) {
    await this.page.route("**/api/agent/run*", (route) => {
      const history: { role: string }[] = route.request().postDataJSON()?.history ?? [];
      const turnNumber = history.filter((message) => message.role === "user").length;
      const turn = turns[Math.min(turnNumber, turns.length - 1)];
      this.toolCalls = turn.toolCalls;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(turn),
      });
    });
  }

  // Live mode: lets the request reach the real agent and records the tool calls it returned.
  // Call it before sending the prompt; await the result after the reply is shown.
  async recordLiveCalls() {
    const response = await this.page.waitForResponse("**/api/agent/run*");
    expect(response.ok(), `agent API returned ${response.status()}`).toBeTruthy();
    const parsed = AgentResponseSchema.safeParse(await response.json());
    expect(parsed.success, `agent response breaks the API contract:\n${parsed.error && z.prettifyError(parsed.error)}`).toBe(true);
    this.toolCalls = parsed.data!.toolCalls;
    this.conversationId = response.request().postDataJSON()?.conversationId;
  }

  // Live mode: what the HR system holds for this conversation after the agent has finished
  async readTimeOff(): Promise<TimeOffState> {
    const response = await this.page.request.get(`/api/time-off/${encodeURIComponent(this.conversationId ?? "")}`);
    expect(response.ok(), "the HR system should return this conversation's time-off data").toBeTruthy();
    return response.json();
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
