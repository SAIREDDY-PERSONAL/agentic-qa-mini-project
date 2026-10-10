// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Dashboard 'Documents on file' count reflects an upload", async ({ page, dashboardPage, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /dashboard.html (seed state).
    await dashboardPage.goto();
    await expect(dashboardPage.documentCount).toHaveText("0");

    // 2. Click 'Documents' in the Main navigation, select 'Certification', set the 'File' input with { name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4096, 1) } (~4 KB) and click 'Upload'.
    await dashboardPage.navigateTo("Documents");
    await expect(documentsPage.heading).toHaveText("Documents");
    await documentsPage.upload({
      type: "Certification",
      file: { name: "cert.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(4096, 1) },
    });
    await expect(documentsPage.message).toHaveText("Uploaded cert.pdf successfully.");
    await expect(documentsPage.documentsTable).toBeVisible();
    await expect(documentsPage.documentRows).toHaveCount(1);
    await expect(documentsPage.documentRows.getByRole("cell")).toContainText(["cert.pdf", "Certification", "4 KB"]);
    await expect(documentsPage.noDocuments).not.toBeVisible();

    // 3. Click 'Dashboard' in the Main navigation (stay in the same tab so sessionStorage persists).
    await documentsPage.navigateTo("Dashboard");
    await expect(dashboardPage.heading).toHaveText("Welcome, Alex Morgan");
    await expect(dashboardPage.documentCount).toHaveText("1");
  });
});
