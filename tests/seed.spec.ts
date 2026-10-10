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
// - Use the page-object fixtures (loginPage, dashboardPage, timeOffPage, documentsPage,
//   directoryPage, profilePage) from tests/pages/. Add a missing locator or action to the
//   page object rather than locating it in the test.
// - In page objects, prefer getByRole / getByLabel locators, then getByTestId; avoid CSS and XPath.
// - Keep assertions in the test, with web-first assertions (toBeVisible, toHaveText, toHaveCount).
import { test, expect, signIn } from "./fixtures.js";

test("seed: signed in on the dashboard", async ({ page, dashboardPage }) => {
  await signIn(page);
  await dashboardPage.goto();
  await expect(dashboardPage.heading).toHaveText("Welcome, Alex Morgan");
});
