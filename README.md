# Agentic HCM Chatbot Evaluation Framework

[![AI Agent Evaluation Suite](https://github.com/haywardsjohnny/agentic-qa-mini-project/actions/workflows/eval-ci.yml/badge.svg)](https://github.com/haywardsjohnny/agentic-qa-mini-project/actions/workflows/eval-ci.yml)

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

- **Chat UI** (`app/index.html`): a minimal chat page that posts to `/api/agent/run` and renders the reply. It's served locally by `http-server`.
- **Fixtures** (`tests/fixtures.ts`): `chatPage` is a page object for the chat UI. `mockAgent` mocks the agent API and records the tool calls it returned.
- **LLM judge** (`src/evaluators/llm_judge.ts`): built with LangChain. It returns a verdict validated against a Zod schema: `score`, `isGrounded`, `isHelpful` and `reasoning`. The provider is picked from your environment: Anthropic Claude if `ANTHROPIC_API_KEY` is set, otherwise OpenAI if `OPENAI_API_KEY` is set, otherwise a local Ollama model.
- **Dataset** (`src/data/eval_dataset.json`): each case defines the prompt, context, mocked tool calls and their results, the expected tool, a minimum score, and whether the reply must be grounded.

## Test cases

| ID | Scenario | Prompt | Expected tool | Min score |
|---|---|---|---|---|
| TC_001 | Happy path | "Schedule 3 days off for next week starting Monday." | `submit_time_off` | 7 |
| TC_002 | Insufficient balance | "Request 20 days off for a vacation next month." | `check_leave_balance` | 5 |
| TC_003 | Out of scope | "How do I make a chocolate cake?" | none (should decline) | 5 |

To add a case, add an entry to `eval_dataset.json`. The suite generates one test per entry.

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
app/index.html                 chat UI under test
src/data/eval_dataset.json     evaluation cases
src/evaluators/llm_judge.ts    LLM-as-judge evaluator
tests/fixtures.ts              chatPage + mockAgent fixtures
tests/e2e/chatbot.spec.ts      data-driven evaluation suite
playwright.config.ts           Playwright config + local web server
.github/workflows/eval-ci.yml  CI pipeline
```

## Limitations

- The agent backend is mocked. Replies and tool calls come from the dataset, so the suite tests the evaluation pipeline and UI, not a live model's decisions.
- Each case runs once. Rerunning the same prompt several times to measure consistency is a natural next step.
