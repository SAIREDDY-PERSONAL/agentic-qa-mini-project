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
function runAgent(prompt) {
  const text = String(prompt ?? "").toLowerCase();
  const balanceCall = {
    toolName: "check_leave_balance",
    args: { employeeId: DEMO_USER.employeeId },
    result: { ptoBalanceDays: PTO_BALANCE_DAYS },
  };

  if (/hr (point of )?contact|hr rep|hr business partner|who is my hr/.test(text)) {
    return {
      reply: `Your HR point of contact is ${HR_CONTACT.name}, ${HR_CONTACT.title}. You can reach her at ${HR_CONTACT.email} or on ${HR_CONTACT.phone}.`,
      toolCalls: [{ toolName: "get_hr_contact", args: { employeeId: DEMO_USER.employeeId }, result: HR_CONTACT }],
    };
  }

  const daysMatch = text.match(/(\d+)\s*days?/);
  if (daysMatch && /off|vacation|leave|pto/.test(text)) {
    const days = Number(daysMatch[1]);
    if (days > PTO_BALANCE_DAYS) {
      return {
        reply: `You only have ${PTO_BALANCE_DAYS} days of PTO available, so I can't submit a ${days}-day request. Please adjust the dates or contact HR.`,
        toolCalls: [balanceCall],
      };
    }
    return {
      reply: `I checked your PTO balance (${PTO_BALANCE_DAYS} days available) and submitted a vacation request for ${days} days. It is pending manager approval.`,
      toolCalls: [
        balanceCall,
        {
          toolName: "submit_time_off",
          args: { employeeId: DEMO_USER.employeeId, type: "vacation", days },
          result: { status: "submitted" },
        },
      ],
    };
  }

  if (/balance|how many (days|pto)|pto/.test(text)) {
    return { reply: `You have ${PTO_BALANCE_DAYS} days of PTO available.`, toolCalls: [balanceCall] };
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
    const { prompt } = await readJsonBody(req);
    return sendJson(res, 200, runAgent(prompt));
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
