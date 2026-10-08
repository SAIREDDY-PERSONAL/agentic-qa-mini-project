// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

const username = process.env.DEMO_USERNAME ?? "demo";
const password = process.env.DEMO_PASSWORD ?? "demo123";

test.describe("Sign-in and sign-out", () => {
  test("Successful sign in lands on the dashboard", async ({ page }) => {
    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 1. Starting from the seed (signed out, on /login.html), fill Username and Password with the demo credentials.
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await expect(page.getByLabel("Username")).toHaveValue(username);
    await expect(page.getByLabel("Password")).toHaveValue(password);

    // 2. Click the "Sign in" button.
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard\.html$/);
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "PTO available" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pending requests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents on file" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
