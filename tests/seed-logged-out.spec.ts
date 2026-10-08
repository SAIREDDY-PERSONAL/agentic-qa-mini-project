// Seed for the Playwright Test Agents when testing sign-in itself.
//
// Starting state: signed out, on the login page.
// Read credentials from the environment (DEMO_USERNAME / DEMO_PASSWORD, default demo / demo123);
// never hard-code them in a test plan or generated test.
//
// Conventions for generated tests: see seed.spec.ts.
import { test, expect } from "./fixtures.js";

test("seed: signed out on the login page", async ({ page }) => {
  await page.goto("/login.html");
  await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
});
