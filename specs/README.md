# Specs

Test plans written by the **playwright-test-planner** agent, or by hand, in Markdown. The **playwright-test-generator** agent turns each scenario into a test under `tests/e2e/`.

## Workflow

Run these in Claude Code from the repo root:

1. **Plan:** "Use the playwright-test-planner agent to plan tests for the Documents page." It explores the running portal and saves a plan here, e.g. `specs/documents.md`.
2. **Review the plan.** Edit or delete scenarios before any code is written. You can also write a plan yourself in the same format.
3. **Generate:** "Use the playwright-test-generator agent to generate tests for `specs/documents.md`." It replays each step in a real browser and writes one test file per scenario.
4. **Heal:** if a generated test fails, "Use the playwright-test-healer agent to fix the failing tests."
5. **Run** `npx playwright test` and open the HTML report (`npx playwright show-report`). Each test has a screenshot of its final state.

## Conventions

- **Seed:** use `tests/seed.spec.ts` (signed in, on the dashboard) for everything behind the login, and `tests/seed-logged-out.spec.ts` for login and logout scenarios.
- **Location:** save generated tests to `tests/e2e/<feature>/<scenario-name>.spec.ts`, and import from `tests/fixtures.ts` using a `.js` extension (ESM), e.g. `import { test, expect } from "../../fixtures.js"`.
- **Credentials:** never put them in a plan or a test. Use `signIn(page)`, or read `DEMO_USERNAME` / `DEMO_PASSWORD` from the environment.
- **Chatbot:** the HR Assistant chat is covered by the data-driven LLM-as-judge suite (`tests/e2e/chatbot.spec.ts` + `src/data/eval_dataset.json`). Add chatbot cases there, not as generated UI tests.
