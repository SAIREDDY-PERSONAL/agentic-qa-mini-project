// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Upload a PDF successfully", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /documents.html. Verify heading 'Documents', and that 'No documents uploaded yet.' is visible and the table has no data rows.
    await page.goto("/documents.html");
    await expect(page.getByRole("heading", { name: "Documents", exact: true })).toBeVisible();
    await expect(noDocuments).toBeVisible();
    await expect(noDocuments).toHaveText("No documents uploaded yet.");
    await expect(table).not.toBeVisible();

    // 2. Select 'Government ID' in the 'Document type' combobox.
    await page.getByLabel("Document type").selectOption("Government ID");
    await expect(page.getByLabel("Document type")).toHaveValue("Government ID");

    // 3. Set the 'File' input via setInputFiles with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB).
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "id-card.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(2048, 1),
    });
    await expect(message).not.toBeVisible();

    // 4. Click the 'Upload' button.
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toHaveText("Uploaded id-card.pdf successfully.");
    await expect(table).toBeVisible();
    await expect(dataRows).toHaveCount(1);
    const today = new Date().toISOString().slice(0, 10);
    await expect(dataRows.getByRole("cell")).toHaveText(["id-card.pdf", "Government ID", "2 KB", today]);
    await expect(noDocuments).not.toBeVisible();
  });
});
