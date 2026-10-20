// Demo HR portal: serves app/public and a few fake API endpoints.
//
// Env:
//   PORT                          default 8080
//   DEMO_USERNAME / DEMO_PASSWORD default demo / demo123
//   BUGS                          comma-separated seeded bugs to switch on, e.g. "upload"
//   HR_DB_PATH                    SQLite file for leave requests, default .data/hr.db
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = fileURLToPath(new URL("./public/", import.meta.url));
const HR_DB_PATH = process.env.HR_DB_PATH ?? fileURLToPath(new URL("../.data/hr.db", import.meta.url));
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

// The "HR system" behind the agent's tools: a SQLite database with one table of leave requests.
// Each chat conversation has its own rows, so tests running at the same time don't change each
// other's data, and the PTO balance is 15 days minus the days that conversation has booked.
// The tables are recreated every time the server starts. Tests can read the data with
// GET /api/time-off/<conversationId>, or query the database file directly.
mkdirSync(dirname(HR_DB_PATH), { recursive: true });
const db = new DatabaseSync(HR_DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  DROP TABLE IF EXISTS leave_requests;
  CREATE TABLE leave_requests (
    request_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    employee_id     TEXT NOT NULL,
    type            TEXT NOT NULL,
    days            INTEGER NOT NULL,
    status          TEXT NOT NULL
  );
`);

function timeOffFor(conversationId) {
  const rows = db
    .prepare("SELECT request_id, type, days, status FROM leave_requests WHERE conversation_id = ? ORDER BY request_id")
    .all(conversationId);
  const requests = rows.map((row) => ({ requestId: `REQ-${row.request_id}`, type: row.type, days: row.days, status: row.status }));
  const daysBooked = requests.reduce((sum, request) => sum + request.days, 0);
  return { balanceDays: PTO_BALANCE_DAYS - daysBooked, requests };
}

// Saves a leave request and returns its id, e.g. "REQ-7"
function saveLeaveRequest(conversationId, days) {
  const result = db
    .prepare("INSERT INTO leave_requests (conversation_id, employee_id, type, days, status) VALUES (?, ?, 'vacation', ?, 'pending')")
    .run(conversationId, DEMO_USER.employeeId, days);
  return `REQ-${result.lastInsertRowid}`;
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
// conversationId picks this conversation's rows in the HR database
// failure is set by tests to simulate a broken system, e.g. "hr-down" makes check_leave_balance fail
function runAgent(prompt, history, conversationId, failure) {
  const text = String(prompt ?? "").toLowerCase();
  const lastUserMessage = String(history.filter((m) => m.role === "user").at(-1)?.text ?? "").toLowerCase();
  const asksForTimeOff = (message) => /\boff\b|vacation|leave/.test(message);
  const balance = timeOffFor(conversationId).balanceDays;
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

    // Save the request in the HR database (which also lowers the balance).
    // Seeded bug "agent-no-save": the agent says it submitted the request, but nothing is saved.
    const requestId = BUGS.includes("agent-no-save") ? "REQ-unsaved" : saveLeaveRequest(conversationId, days);

    return {
      reply: `I checked your PTO balance (${balance} days available) and submitted a vacation request for ${days} days. It is pending manager approval.`,
      toolCalls: [
        balanceCall,
        {
          toolName: "submit_time_off",
          args: { employeeId: DEMO_USER.employeeId, type: "vacation", days },
          result: { status: "pending manager approval", requestId },
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
    if (typeof prompt !== "string" || !prompt.trim()) {
      return sendJson(res, 400, { error: "prompt is required" });
    }
    const failure = req.headers["x-simulate-failure"];
    const reply = runAgent(prompt, Array.isArray(history) ? history : [], String(conversationId ?? "default"), failure);
    return sendJson(res, 200, reply);
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
