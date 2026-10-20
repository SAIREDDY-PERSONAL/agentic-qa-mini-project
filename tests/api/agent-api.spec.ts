import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { AgentResponseSchema } from "../fixtures.js";
import { queryHrDb } from "../hr-db.js";

// API and database tests for the agent: they call /api/agent/run directly (no browser, no judge,
// no API key) and then check the HR database with SQL. Each test uses a new conversation id,
// so its rows in the database are its own.

type Message = { role: "user" | "assistant"; text: string };

async function askAgent(
  request: APIRequestContext,
  conversationId: string,
  prompt: string,
  options: { history?: Message[]; headers?: Record<string, string> } = {},
) {
  const response = await request.post("/api/agent/run", {
    data: { prompt, history: options.history ?? [], conversationId },
    headers: options.headers,
  });
  expect(response.status(), "the agent API should answer with 200").toBe(200);
  return AgentResponseSchema.parse(await response.json());
}

function leaveRequestsInDb(conversationId: string) {
  return queryHrDb(
    "SELECT employee_id, type, days, status FROM leave_requests WHERE conversation_id = ?",
    conversationId,
  );
}

test.describe("Agent API and HR database", { tag: "@api" }, () => {
  test("returns a reply and tool calls in the agreed format", async ({ request }) => {
    const answer = await askAgent(request, randomUUID(), "Who is my HR point of contact?");

    expect(answer.reply).toContain("Priya Sharma");
    expect(answer.toolCalls.map((call) => call.toolName)).toEqual(["get_hr_contact"]);
  });

  test("rejects a request without a prompt", async ({ request }) => {
    const response = await request.post("/api/agent/run", { data: { conversationId: randomUUID() } });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "prompt is required" });
  });

  test("booking 3 days saves one leave request in the database", async ({ request }) => {
    const conversationId = randomUUID();
    const answer = await askAgent(request, conversationId, "Book 3 days off next week.");

    expect(answer.toolCalls.map((call) => call.toolName)).toEqual(["check_leave_balance", "submit_time_off"]);
    expect(leaveRequestsInDb(conversationId)).toEqual([
      { employee_id: "1042", type: "vacation", days: 3, status: "pending" },
    ]);
    // The API reports the same data: 15 days minus the 3 just booked
    const timeOff = await (await request.get(`/api/time-off/${conversationId}`)).json();
    expect(timeOff.balanceDays).toBe(12);
  });

  test("a request bigger than the balance saves nothing", async ({ request }) => {
    const conversationId = randomUUID();
    const answer = await askAgent(request, conversationId, "Book 20 days off next month.");

    expect(answer.reply).toContain("only have 15 days");
    expect(leaveRequestsInDb(conversationId)).toEqual([]);
  });

  test("uses the earlier messages of the conversation", async ({ request }) => {
    const conversationId = randomUUID();
    const history: Message[] = [
      { role: "user", text: "I'd like to take some time off next week." },
      { role: "assistant", text: "Sure. How many days would you like to take off?" },
    ];
    await askAgent(request, conversationId, "3 days, starting Monday.", { history });

    expect(leaveRequestsInDb(conversationId)).toEqual([
      { employee_id: "1042", type: "vacation", days: 3, status: "pending" },
    ]);
  });

  test("conversations don't share data", async ({ request }) => {
    const first = randomUUID();
    const second = randomUUID();
    await askAgent(request, first, "Book 3 days off next week.");

    expect(leaveRequestsInDb(first)).toHaveLength(1);
    expect(leaveRequestsInDb(second)).toEqual([]);
  });

  test("when the HR system is down, nothing is saved", async ({ request }) => {
    const conversationId = randomUUID();
    const answer = await askAgent(request, conversationId, "Book 2 days off next Friday.", {
      headers: { "x-simulate-failure": "hr-down" },
    });

    expect(answer.reply).toContain("couldn't reach the HR system");
    expect(answer.toolCalls.map((call) => call.toolName)).not.toContain("submit_time_off");
    expect(leaveRequestsInDb(conversationId)).toEqual([]);
  });
});
