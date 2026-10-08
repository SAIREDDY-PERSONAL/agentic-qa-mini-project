// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

const username = process.env.DEMO_USERNAME ?? "demo";
const password = process.env.DEMO_PASSWORD ?? "demo123";

test.describe("Sign-in and sign-out", () => {
  test("Log out returns to login with a confirmation and ends the session", async ({ page }) => {
    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 1. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD) and confirm /dashboard.html loads.
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard\.html$/);
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

    // 2. Click the "Log out" button in the header.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login\.html\?loggedOut=1$/);
    await expect(page.getByText("You have been logged out.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 3. Navigate directly to /dashboard.html.
    await page.goto("/dashboard.html");
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toHaveCount(0);

    // 4. Navigate back (browser Back) to a protected page if reachable.
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);
  });
});
