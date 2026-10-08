// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Dashboard 'Documents on file' count reflects an upload", async ({ page }) => {
    await signIn(page);
    const documentsOnFile = page
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: "Documents on file" }) });
    const mainNav = page.getByRole("navigation", { name: "Main" });
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /dashboard.html (seed state).
    await page.goto("/dashboard.html");
    await expect(documentsOnFile.getByRole("paragraph").first()).toHaveText("0");

    // 2. Click 'Documents' in the Main navigation, select 'Certification', set the 'File' input with { name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4096, 1) } (~4 KB) and click 'Upload'.
    await mainNav.getByRole("link", { name: "Documents" }).click();
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toBeVisible();
    await page.getByLabel("Document type").selectOption("Certification");
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "cert.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(4096, 1),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByTestId("upload-message")).toHaveText("Uploaded cert.pdf successfully.");
    await expect(table).toBeVisible();
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.getByRole("cell")).toContainText(["cert.pdf", "Certification", "4 KB"]);
    await expect(noDocuments).not.toBeVisible();

    // 3. Click 'Dashboard' in the Main navigation (stay in the same tab so sessionStorage persists).
    await mainNav.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await expect(documentsOnFile.getByRole("paragraph").first()).toHaveText("1");
  });
});
