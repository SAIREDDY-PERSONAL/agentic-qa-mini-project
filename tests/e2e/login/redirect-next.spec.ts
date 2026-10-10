// spec: specs/login.md
// seed: tests/seed-logged-out.spec.ts
import { test, expect } from "../../fixtures.js";
import { DashboardPage, LoginPage } from "../../pages/index.js";

test.describe("Sign-in and sign-out", () => {
  test("Protected page redirects to login, then returns to the requested page after sign in", async ({
    page,
    browser,
    baseURL,
    loginPage,
    documentsPage,
  }) => {
    // The final step runs in a separate browser context the UI judge cannot screenshot
    test.info().annotations.push({ type: "ui-judge", description: "skip: final step runs in a separate browser context" });

    await loginPage.goto();
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");

    // 1. Navigate directly to /documents.html while signed out.
    await documentsPage.goto();
    await expect(page).toHaveURL(/\/login\.html\?next=%2Fdocuments\.html$/);
    await expect(loginPage.heading).toHaveText("Sign in to Acme HR");
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toHaveCount(0);

    // 2. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD).
    await loginPage.signIn();
    await expect(page).toHaveURL(/\/documents\.html$/);
    await expect(documentsPage.heading).toHaveText("Documents");
    await expect(page.getByRole("heading", { name: "Upload a document" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();

    // 3. Negative check in a fresh signed-out context: open /login.html?next=https://example.com and sign in with the demo credentials.
    const freshContext = await browser.newContext({ baseURL });
    const freshPage = await freshContext.newPage();
    const freshLogin = new LoginPage(freshPage);
    await freshLogin.goto("?next=https://example.com");
    await freshLogin.signIn();
    await expect(freshPage).toHaveURL(/\/dashboard\.html$/);
    await expect(new DashboardPage(freshPage).heading).toHaveText("Welcome, Alex Morgan");
    await freshContext.close();
  });
});
