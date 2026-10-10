// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect, demoCredentials } from "../../fixtures.js";

const { username, password } = demoCredentials;

test.describe("Sign-in and sign-out", () => {
  test("Successful sign in lands on the dashboard", { tag: "@smoke" }, async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. Starting from the seed (signed out, on /login.html), fill Username and Password with the demo credentials.
    await loginPage.fillCredentials(username, password);
    await expect(loginPage.username).toHaveValue(username);
    await expect(loginPage.password).toHaveValue(password);

    // 2. Click the "Sign in" button.
    await loginPage.signInButton.click();
    await expect(page).toHaveURL(/\/dashboard\.html$/);
    await expect(dashboardPage.heading).toHaveText("Welcome, Alex Morgan");
    await expect(dashboardPage.ptoCard).toBeVisible();
    await expect(dashboardPage.pendingCard).toBeVisible();
    await expect(dashboardPage.documentsCard).toBeVisible();
    await expect(dashboardPage.logOutButton).toBeVisible();
    await expect(loginPage.error).toHaveCount(0);
  });
});
