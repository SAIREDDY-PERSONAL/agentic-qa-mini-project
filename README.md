# Agentic HCM Chatbot Evaluation Framework

[![AI Agent Evaluation Suite](https://github.com/SAIREDDY-PERSONAL/agentic-qa-mini-project/actions/workflows/eval-ci.yml/badge.svg)](https://github.com/SAIREDDY-PERSONAL/agentic-qa-mini-project/actions/workflows/eval-ci.yml)

An evaluation framework for an agentic HR chatbot, written in TypeScript. Playwright drives the chat UI and checks which tools the agent called. An LLM judge then scores each reply for groundedness and helpfulness.

Agent replies are non-deterministic, so exact-match assertions don't work well. Each test therefore checks two things:

1. **Behaviour:** did the agent use the expected tool (e.g. `submit_time_off`) with the right arguments?
2. **Quality:** does an LLM judge rate the reply as grounded in the context and tool results, with a score above a set threshold?

## How it works

```
eval_dataset.json ──► chatbot.spec.ts (one test per case)
                          │
                          ├─ mockAgent  ── intercepts /api/agent/run, returns the case's reply + tool calls
                          ├─ chatPage   ── types the prompt into the chat UI, reads the response bubble
                          ├─ assert     ── expected tool was called
                          └─ LLM judge  ── scores the reply (0–10, grounded, helpful, reasoning)
                                            └─ assert score ≥ minScore, grounded if required
```

- **Demo HR portal** (`app/`): a small HR site served by `app/server.mjs`, with no dependencies. See [Demo HR portal](#demo-hr-portal) below. The chatbot suite uses its HR Assistant page (`/chat.html`) and mocks `/api/agent/run`, so the judge sees fixed replies.
- **Fixtures** (`tests/fixtures.ts`): `chatPage` is a page object for the chat UI. `mockAgent` mocks the agent API and records the tool calls it returned. The portal's page objects (`loginPage`, `dashboardPage`, `timeOffPage`, `documentsPage`, `directoryPage`, `profilePage`) live in `tests/pages/` and are injected as fixtures into the UI tests.
- **LLM judge** (`src/evaluators/llm_judge.ts`): built with LangChain. It returns a verdict validated against a Zod schema: `score`, `isGrounded`, `isHelpful` and `reasoning`. The provider is picked from your environment: Anthropic Claude if `ANTHROPIC_API_KEY` is set, otherwise OpenAI if `OPENAI_API_KEY` is set, otherwise a local Ollama model.
- **Dataset** (`src/data/eval_dataset.json`): each case defines the prompt, context, mocked tool calls and their results, the expected tool, a minimum score, and whether the reply must be grounded.

## Test cases

| ID | Scenario | Prompt | Expected tool | Min score |
|---|---|---|---|---|
| TC_001 | Happy path | "Schedule 3 days off for next week starting Monday." | `submit_time_off` | 7 |
| TC_002 | Insufficient balance | "Request 20 days off for a vacation next month." | `check_leave_balance` | 5 |
| TC_003 | Out of scope | "How do I make a chocolate cake?" | none (should decline) | 5 |
| TC_004 | HR point of contact | "Who is my HR point of contact?" | `get_hr_contact` | 7 |

To add a case, add an entry to `eval_dataset.json`. The suite generates one test per entry.

## Demo HR portal

Run `node app/server.mjs` and open http://localhost:8080. Sign in with `demo` / `demo123`.

| Page | What it does |
|---|---|
| Login | Checks credentials against `/api/login`, shows an error for wrong ones, and supports logout |
| Dashboard | Welcome message, PTO available, pending requests and document count |
| Time off | Leave request form: blocks insufficient balance, end-before-start dates and weekend-only ranges; lists pending requests |
| Documents | Upload PDF, PNG or JPG files up to 2 MB, with type and size checks, and a list of your documents |
| Directory | Search employees by name or department |
| My profile | Edit phone and address, with format checks and a save confirmation |
| HR Assistant | Chat backed by a keyword-based fake agent (`/api/agent/run`) that answers time-off and HR point-of-contact questions |

User data (requests, documents, profile edits) lives in `sessionStorage`, so every browser session and every test starts clean.

**Seeded bugs.** Set `BUGS` to break a feature on purpose and show that tests catch it. For example, `BUGS=upload node app/server.mjs` makes uploads show the success message without saving the document.

## Playwright Test Agents

New UI tests are created with Playwright's official [Test Agents](https://playwright.dev/docs/test-agents), which run as Claude Code subagents (`.claude/agents/`) through the `playwright-test` MCP server (`.mcp.json`):

- **Planner** explores the running portal and writes a Markdown test plan to `specs/`.
- **Generator** replays each plan step in a real browser and writes the test to `tests/e2e/`.
- **Healer** runs failing tests, debugs them and fixes them.

The agents start from a seed test: `tests/seed.spec.ts` signs in through the API, and `tests/seed-logged-out.spec.ts` starts on the login page. The seed also shows the conventions generated tests should follow. Plans and generated tests are reviewed in a PR like any other code. See [`specs/README.md`](specs/README.md) for the workflow.

## UI test suite (agent-generated)

The portal's UI tests were planned and written by the Playwright Test Agents, then reviewed. Each test file links back to its plan.

| Feature | Plan | Tests |
|---|---|---|
| Sign in / sign out | `specs/login.md` | `tests/e2e/login/` (6) |
| Time off | `specs/time-off.md` | `tests/e2e/time-off/` (7) |
| Documents | `specs/documents.md` | `tests/e2e/documents/` (7) |
| Employee directory | `specs/directory.md` | `tests/e2e/directory/` (5) |
| Profile + navigation | `specs/profile-and-navigation.md` | `tests/e2e/profile/` (5), `tests/e2e/navigation/` (1) |

These are ordinary Playwright tests with role/label locators and web-first assertions, and no LLM runs at test time. The upload tests check the new document row as well as the success message, so they fail when the seeded `upload` bug is on.

## Independent UI judge

A generated test checks what its generator decided to assert. If that's too weak, for example only a success message, the test can pass while the feature is broken. The UI judge is a second, independent check. It doesn't see the test code. After each UI test, it gets:

- the scenario from the test's plan (found through the file's `// spec:` comment and the test title)
- the final page: a full-page screenshot, the accessibility snapshot and the URL

It scores each expected result of the scenario's **last step** (the state the final page actually shows) as *met*, *contradicted* or *not verifiable*. The verdict is derived from those checks in code, not chosen by the model: any contradiction means **FAIL**, all met means **PASS**, otherwise **INCONCLUSIVE**. The verdict and per-check evidence are attached to the test in the HTML report. If the judge says FAIL but the test's own assertions passed, the test fails.

```bash
npm run test:judge   # full suite with the judge (needs ANTHROPIC_API_KEY or OPENAI_API_KEY)
npm run judge:demo   # BUGS=upload on port 8093: a deliberately weak upload test passes its own
                     # assertions, and the judge fails it ("success message shown, but the list is empty")
```

The judge is opt-in (`UI_JUDGE=1`) because it makes one vision-model call per UI test. Pull-request CI stays deterministic, and the **UI Judge (on demand)** workflow runs it in GitHub Actions. A test whose final state isn't on its main page can opt out with a reason (see `tests/e2e/login/redirect-next.spec.ts`).

## Running it

Requires Node.js 20+.

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # then add your API key (see below)
npm test               # runs the suite; the HTML report is written to playwright-report/
npm run typecheck      # strict TypeScript check
```

### Configuration

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Use Claude as the judge (preferred) |
| `ANTHROPIC_MODEL` | Judge model, default `claude-haiku-5-5` |
| `ANTHROPIC_WORKSPACE_ID` | Optional Anthropic workspace header |
| `OPENAI_API_KEY` | Use OpenAI `gpt-4o-mini` if no Anthropic key is set |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local fallback, default `http://localhost:11434` and `llama3.2` |
| `DEMO_USERNAME`, `DEMO_PASSWORD` | Portal login, default `demo` / `demo123`. Tests sign in with the same values |
| `BUGS` | Comma-separated seeded bugs to switch on, e.g. `upload` |

### Sample judge output

```
--- [TC_002] Evaluation Report ---
Score: 8/10 | Grounded: true | Helpful: true
Reasoning: The chatbot called check_leave_balance with employeeId "1042", which matches the
system context. The response accurately reports the 5-day PTO balance and correctly declines
the 20-day request, so it is grounded with no hallucinated figures...
```

## CI

GitHub Actions (`.github/workflows/eval-ci.yml`) runs on every push and pull request to `main`. It type-checks the code, runs the full evaluation suite, and uploads the Playwright HTML report as an artifact. `main` is branch-protected, so changes go in through pull requests that must pass this check. A `Jenkinsfile` is also included for running the suite in Jenkins.

## Project structure

```
app/server.mjs                 demo HR portal server (static pages + fake APIs)
app/public/                    portal pages, scripts, styles and directory data
src/data/eval_dataset.json     evaluation cases
src/evaluators/llm_judge.ts    LLM-as-judge evaluator
tests/fixtures.ts              chatPage + mockAgent + page-object fixtures
tests/pages/                   page objects for the portal (one per page, shared header in BasePage)
tests/e2e/chatbot.spec.ts      data-driven evaluation suite
tests/e2e/<feature>/           agent-generated UI tests for the portal
tests/judge-demo/              deliberately weak test, only run by npm run judge:demo
src/evaluators/ui_judge.ts     independent UI judge (plan + final screenshot)
tests/seed*.spec.ts            starting points for the Playwright Test Agents
specs/                         test plans written by the planner agent
.claude/agents/                Playwright planner / generator / healer agents
playwright.config.ts           Playwright config + local web server
.github/workflows/eval-ci.yml  CI pipeline
```

## Limitations

- The agent backend is mocked. Replies and tool calls come from the dataset, so the suite tests the evaluation pipeline and UI, not a live model's decisions.
- Each case runs once. Rerunning the same prompt several times to measure consistency is a natural next step.
