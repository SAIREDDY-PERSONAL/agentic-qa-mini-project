// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";

const username = process.env.DEMO_USERNAME ?? "demo";
const password = process.env.DEMO_PASSWORD ?? "demo123";

test.describe("Sign-in and sign-out", () => {
  test("Protected page redirects to login, then returns to the requested page after sign in", async ({
    page,
    browser,
    baseURL,
  }) => {
    // The final step runs in a separate browser context the UI judge cannot screenshot
    test.info().annotations.push({ type: "ui-judge", description: "skip: final step runs in a separate browser context" });

    await page.goto("/login.html");
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();

    // 1. Navigate directly to /documents.html while signed out.
    await page.goto("/documents.html");
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdocuments\.html$/);
    await expect(page.getByRole("heading", { name: "Sign in to Acme HR" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toHaveCount(0);

    // 2. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD).
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/documents\.html$/);
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upload a document" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();

    // 3. Negative check in a fresh signed-out context: open /login.html?next=https://example.com and sign in with the demo credentials.
    const freshContext = await browser.newContext({ baseURL });
    const freshPage = await freshContext.newPage();
    await freshPage.goto("/login.html?next=https://example.com");
    await freshPage.getByLabel("Username").fill(username);
    await freshPage.getByLabel("Password").fill(password);
    await freshPage.getByRole("button", { name: "Sign in" }).click();
    await expect(freshPage).toHaveURL(/\/dashboard\.html$/);
    await expect(freshPage.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await freshContext.close();
  });
});
