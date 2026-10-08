// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

test.describe("Sign-in and sign-out", () => {
  test("Protected pages are inaccessible when signed out", async ({ page }) => {
    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 1. Navigate directly to /dashboard.html while signed out.
    await page.goto("/dashboard.html");
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);

    // 2. Navigate directly to /documents.html.
    await page.goto("/documents.html");
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdocuments\.html$/);
  });
});
