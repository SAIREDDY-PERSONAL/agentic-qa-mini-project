// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

const username = process.env.DEMO_USERNAME ?? "demo";
const password = process.env.DEMO_PASSWORD ?? "demo123";

test.describe("Sign-in and sign-out", () => {
  test("Invalid credentials show an error and stay on login", async ({ page }) => {
    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
    const alert = page.getByRole("alert");

    // 1. Fill Username with "wronguser" and Password with "wrongpass", then click "Sign in".
    await page.getByLabel("Username").fill("wronguser");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alert).toHaveText("Invalid username or password.");
    await expect(page).toHaveURL(/\/login\.html$/);
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 2. Fill Username with the valid demo username but an incorrect password, then click "Sign in".
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(`${password}-incorrect`);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alert).toHaveText("Invalid username or password.");
    await expect(page).toHaveURL(/\/login\.html$/);

    // 3. Navigate directly to /dashboard.html.
    await page.goto("/dashboard.html");
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdashboard\.html$/);
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
  });
});
