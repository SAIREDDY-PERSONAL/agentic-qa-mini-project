// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

test.describe("Sign-in and sign-out", () => {
  test("Log out returns to login with a confirmation and ends the session", async ({ page, loginPage, dashboardPage }) => {
    const welcome = page.getByRole("heading", { name: "Welcome, Alex Morgan" });
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD) and confirm /dashboard.html loads.
    await loginPage.signIn();
    await expect(page).toHaveURL(/\/dashboard\.html$/);
    await expect(dashboardPage.heading).toHaveText("Welcome, Alex Morgan");
    await expect(dashboardPage.logOutButton).toBeVisible();

    // 2. Click the "Log out" button in the header.
    await dashboardPage.logOut();
    await expect(page).toHaveURL(/\/login\.html\?loggedOut=1$/);
    await expect(loginPage.loggedOutMessage).toBeVisible();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 3. Navigate directly to /dashboard.html.
    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(welcome).toHaveCount(0);

    // 4. Navigate back (browser Back) to a protected page if reachable.
    await page.goBack();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");
    await expect(welcome).toHaveCount(0);
    await expect(loginPage.logOutButton).toHaveCount(0);
  });
});
