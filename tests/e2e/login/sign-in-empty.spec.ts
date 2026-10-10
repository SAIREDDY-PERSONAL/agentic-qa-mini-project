// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect, demoCredentials } from "../../fixtures.js";

const { username, password } = demoCredentials;

test.describe("Sign-in and sign-out", () => {
  test("Empty fields show a validation error", async ({ page, loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. With both fields empty, click "Sign in".
    await loginPage.signInButton.click();
    await expect(loginPage.error).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 2. Fill only Username with the demo username (leave Password empty) and click "Sign in".
    await loginPage.username.fill(username);
    await loginPage.signInButton.click();
    await expect(loginPage.error).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 3. Clear Username, fill only Password with any value, and click "Sign in".
    await loginPage.signIn("", password);
    await expect(loginPage.error).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);
  });
});
