// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Upload a PDF successfully", { tag: "@smoke" }, async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html. Verify heading 'Documents', and that 'No documents uploaded yet.' is visible and the table has no data rows.
    await documentsPage.goto();
    await expect(documentsPage.heading).toHaveText("Documents");
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.noDocuments).toHaveText("No documents uploaded yet.");
    await expect(documentsPage.documentsTable).not.toBeVisible();

    // 2. Select 'Government ID' in the 'Document type' combobox.
    await documentsPage.selectType("Government ID");
    await expect(documentsPage.documentType).toHaveValue("Government ID");

    // 3. Set the 'File' input via setInputFiles with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB).
    await documentsPage.chooseFile({ name: "id-card.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(2048, 1) });
    await expect(documentsPage.message).not.toBeVisible();

    // 4. Click the 'Upload' button.
    await documentsPage.uploadButton.click();
    await expect(documentsPage.message).toHaveText("Uploaded id-card.pdf successfully.");
    await expect(documentsPage.documentsTable).toBeVisible();
    await expect(documentsPage.documentRows).toHaveCount(1);
    const today = new Date().toISOString().slice(0, 10);
    await expect(documentsPage.documentRows.getByRole("cell")).toHaveText(["id-card.pdf", "Government ID", "2 KB", today]);
    await expect(documentsPage.noDocuments).not.toBeVisible();
  });
});
