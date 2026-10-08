// Seed for the Playwright Test Agents (planner / generator / healer): the agents run this
// test first, then explore and record from the page it leaves open.
//
// Starting state: signed in as the demo user (Alex Morgan), on the dashboard.
// Use it for every feature behind the login. For login/logout tests use seed-logged-out.spec.ts.
//
// Conventions for generated tests (the generator copies the style of this file):
// - Import `test` and `expect` from the shared fixtures (with the .js extension, e.g.
//   "../../fixtures.js" from tests/e2e/<feature>/), not from @playwright/test.
// - Sign in with `signIn(page)`, never by typing credentials into the form.
// - Prefer getByRole / getByLabel locators, then getByTestId; avoid CSS and XPath.
// - Assert outcomes with web-first assertions (toBeVisible, toHaveText, toHaveCount).
import { test, expect, signIn } from "./fixtures.js";

test("seed: signed in on the dashboard", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard.html");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
});
