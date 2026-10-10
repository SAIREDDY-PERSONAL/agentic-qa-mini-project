// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect, demoCredentials } from "../../fixtures.js";

const { username, password } = demoCredentials;

test.describe("Sign-in and sign-out", () => {
  test("Invalid credentials show an error and stay on login", async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. Fill Username with "wronguser" and Password with "wrongpass", then click "Sign in".
    await loginPage.signIn("wronguser", "wrongpass");
    await expect(loginPage.error).toHaveText("Invalid username or password.");
    await expect(page).toHaveURL(/\/login\.html$/);
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 2. Fill Username with the valid demo username but an incorrect password, then click "Sign in".
    await loginPage.signIn(username, `${password}-incorrect`);
    await expect(loginPage.error).toHaveText("Invalid username or password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 3. Navigate directly to /dashboard.html.
    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");
  });
});
