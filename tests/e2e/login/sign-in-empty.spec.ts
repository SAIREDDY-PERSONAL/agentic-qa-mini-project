// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

const username = process.env.DEMO_USERNAME ?? "demo";
const password = process.env.DEMO_PASSWORD ?? "demo123";

test.describe("Sign-in and sign-out", () => {
  test("Empty fields show a validation error", async ({ page }) => {
    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
    const alert = page.getByRole("alert");

    // 1. With both fields empty, click "Sign in".
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alert).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 2. Fill only Username with the demo username (leave Password empty) and click "Sign in".
    await page.getByLabel("Username").fill(username);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alert).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 3. Clear Username, fill only Password with any value, and click "Sign in".
    await page.getByLabel("Username").fill("");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alert).toHaveText("Enter your username and password.");
    await expect(page).toHaveURL(/\/login\.html$/);
  });
});
