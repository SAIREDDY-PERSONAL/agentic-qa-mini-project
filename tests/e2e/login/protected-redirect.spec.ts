// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

test.describe("Sign-in and sign-out", () => {
  test("Protected pages are inaccessible when signed out", { tag: "@smoke" }, async ({ page, loginPage, dashboardPage, documentsPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. Navigate directly to /dashboard.html while signed out.
    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");
    await expect(loginPage.logOutButton).toHaveCount(0);

    // 2. Navigate directly to /documents.html.
    await documentsPage.goto();
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdocuments\.html$/);
  });
});
