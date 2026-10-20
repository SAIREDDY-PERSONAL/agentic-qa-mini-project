// Demo HR portal: serves app/public and a few fake API endpoints.
//
// Env:
//   PORT                          default 8080
//   DEMO_USERNAME / DEMO_PASSWORD default demo / demo123
//   BUGS                          comma-separated seeded bugs to switch on, e.g. "upload"
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = fileURLToPath(new URL("./public/", import.meta.url));
const PORT = Number(process.env.PORT ?? 8080);
const USERNAME = process.env.DEMO_USERNAME ?? "demo";
const PASSWORD = process.env.DEMO_PASSWORD ?? "demo123";
const BUGS = (process.env.BUGS ?? "").split(",").map((b) => b.trim()).filter(Boolean);

const DEMO_USER = {
  name: "Alex Morgan",
  employeeId: "1042",
  department: "Engineering",
  email: "alex.morgan@acme-hr.example",
};
const PTO_BALANCE_DAYS = 15;
const HR_CONTACT = {
  name: "Priya Sharma",
  title: "HR Business Partner, Engineering",
  email: "priya.sharma@acme-hr.example",
  phone: "ext. 4471",
};

// The "HR system" behind the agent's tools: a PTO balance and the leave requests the agent
// submitted. It is kept separately for each chat conversation, so tests running at the same time
// don't change each other's data. Tests read it with GET /api/time-off/<conversationId>.
const timeOffByConversation = new Map();

function timeOffFor(conversationId) {
  if (!timeOffByConversation.has(conversationId)) {
    timeOffByConversation.set(conversationId, { balanceDays: PTO_BALANCE_DAYS, requests: [] });
  }
  return timeOffByConversation.get(conversationId);
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": CONTENT_TYPES[".json"] });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

// Keyword-based stand-in for the real HR agent: returns a reply plus the tool calls it "made".
// history holds the earlier messages of the conversation: [{ role: "user" | "assistant", text }]
// timeOff is this conversation's HR data, which submit_time_off changes
// failure is set by tests to simulate a broken system, e.g. "hr-down" makes check_leave_balance fail
function runAgent(prompt, history, timeOff, failure) {
  const text = String(prompt ?? "").toLowerCase();
  const lastUserMessage = String(history.filter((m) => m.role === "user").at(-1)?.text ?? "").toLowerCase();
  const asksForTimeOff = (message) => /\boff\b|vacation|leave/.test(message);
  const balance = timeOff.balanceDays;
  const hrDown = failure === "hr-down";
  const balanceCall = {
    toolName: "check_leave_balance",
    args: { employeeId: DEMO_USER.employeeId },
    result: hrDown ? { error: "HR system unavailable" } : { ptoBalanceDays: balance },
  };

  // Guardrail: don't follow instructions to ignore the rules
  if (/ignore (all|any|your|previous|the)|admin mode|developer mode|system prompt/.test(text)) {
    return {
      reply: "I can't change how I work or bypass HR rules. I can help with your own time off, your HR contact, documents or your profile.",
      toolCalls: [],
    };
  }

  // Guardrail: only share the signed-in employee's own data
  if (/salary|another employee|someone else|colleague|coworker|\b[a-z]+'s (pto|balance|leave)/.test(text)) {
    return {
      reply: "I can only share your own HR information. For questions about another employee, please contact HR.",
      toolCalls: [],
    };
  }

  if (/hr (point of )?contact|hr rep|hr business partner|who is my hr/.test(text)) {
    return {
      reply: `Your HR point of contact is ${HR_CONTACT.name}, ${HR_CONTACT.title}. You can reach her at ${HR_CONTACT.email} or on ${HR_CONTACT.phone}.`,
      toolCalls: [{ toolName: "get_hr_contact", args: { employeeId: DEMO_USER.employeeId }, result: HR_CONTACT }],
    };
  }

  // A time-off request, either in this message or in the one before (e.g. "I'd like time off" then "3 days")
  const daysMatch = text.match(/(\d+)\s*days?/);
  if (daysMatch && (/off|vacation|leave|pto/.test(text) || asksForTimeOff(lastUserMessage))) {
    const days = Number(daysMatch[1]);
    // The balance check failed: say so, and don't submit anything
    if (hrDown) {
      return {
        reply: "I couldn't reach the HR system to check your PTO balance, so I haven't submitted anything. Please try again later.",
        toolCalls: [balanceCall],
      };
    }
    if (days > balance) {
      return {
        reply: `You only have ${balance} days of PTO available, so I can't submit a ${days}-day request. Please adjust the dates or contact HR.`,
        toolCalls: [balanceCall],
      };
    }

    // Save the request in the HR system and take the days off the balance.
    // Seeded bug "agent-no-save": the agent says it submitted the request, but nothing is saved.
    const request = { requestId: `REQ-${timeOff.requests.length + 1}`, type: "vacation", days, status: "pending" };
    if (!BUGS.includes("agent-no-save")) {
      timeOff.requests.push(request);
      timeOff.balanceDays -= days;
    }

    return {
      reply: `I checked your PTO balance (${balance} days available) and submitted a vacation request for ${days} days. It is pending manager approval.`,
      toolCalls: [
        balanceCall,
        {
          toolName: "submit_time_off",
          args: { employeeId: DEMO_USER.employeeId, type: "vacation", days },
          result: { status: "pending manager approval", requestId: request.requestId },
        },
      ],
    };
  }

  // Time off without a number of days: ask how many before doing anything
  if (asksForTimeOff(text)) {
    return { reply: "Sure. How many days would you like to take off?", toolCalls: [] };
  }

  if (/balance|how many (days|pto)|pto/.test(text)) {
    if (hrDown) return { reply: "I couldn't reach the HR system to check your PTO balance. Please try again later.", toolCalls: [balanceCall] };
    return { reply: `You have ${balance} days of PTO available.`, toolCalls: [balanceCall] };
  }

  return {
    reply: "I'm the HR assistant, so I can only help with workplace topics like time off, your HR contact, documents, or your profile.",
    toolCalls: [],
  };
}

async function handleApi(req, res, path) {
  if (req.method === "POST" && path === "/api/login") {
    const { username, password } = await readJsonBody(req);
    if (username === USERNAME && password === PASSWORD) return sendJson(res, 200, { user: DEMO_USER });
    return sendJson(res, 401, { error: "Invalid username or password." });
  }
  if (req.method === "POST" && path === "/api/agent/run") {
    const { prompt, history, conversationId } = await readJsonBody(req);
    const timeOff = timeOffFor(String(conversationId ?? "default"));
    const failure = req.headers["x-simulate-failure"];
    return sendJson(res, 200, runAgent(prompt, Array.isArray(history) ? history : [], timeOff, failure));
  }
  // What the HR system holds for one conversation: { balanceDays, requests }
  if (req.method === "GET" && path.startsWith("/api/time-off/")) {
    const conversationId = decodeURIComponent(path.slice("/api/time-off/".length));
    return sendJson(res, 200, timeOffFor(conversationId));
  }
  if (req.method === "GET" && path === "/api/config") {
    return sendJson(res, 200, { bugs: BUGS, ptoBalanceDays: PTO_BALANCE_DAYS });
  }
  return sendJson(res, 404, { error: "Not found" });
}

async function serveStatic(res, path) {
  const file = normalize(join(PUBLIC_DIR, path === "/" ? "index.html" : path));
  if (!file.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: "Forbidden" });
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname.startsWith("/api/")) return handleApi(req, res, pathname);
  return serveStatic(res, decodeURIComponent(pathname));
}).listen(PORT, () => {
  console.log(`HR demo portal on http://localhost:${PORT}${BUGS.length ? ` (bugs: ${BUGS.join(", ")})` : ""}`);
});
