// Seed for the Playwright Test Agents when testing sign-in itself.
//
// Starting state: signed out, on the login page.
// Read credentials from the environment (DEMO_USERNAME / DEMO_PASSWORD, default demo / demo123);
// never hard-code them in a test plan or generated test (use `demoCredentials` or `loginPage.signIn()`).
//
// Conventions for generated tests: see seed.spec.ts.
import { test, expect } from "./fixtures.js";

test("seed: signed out on the login page", async ({ loginPage }) => {
  await loginPage.goto();
  await expect(loginPage.heading).toHaveText("Sign in to Acme HR");
});
