// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Upload an image (PNG) successfully", async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html.
    await documentsPage.goto();
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.noDocuments).toHaveText("No documents uploaded yet.");

    // 2. Select 'W-4 Tax Form' in 'Document type'.
    await documentsPage.selectType("W-4 Tax Form");
    await expect(documentsPage.documentType).toHaveValue("W-4 Tax Form");

    // 3. Set the 'File' input via setInputFiles with { name: 'scan.png', mimeType: 'image/png', buffer: Buffer.alloc(1024, 1) } (~1 KB).
    await documentsPage.chooseFile({ name: "scan.png", mimeType: "image/png", buffer: Buffer.alloc(1024, 1) });
    await expect(documentsPage.message).not.toBeVisible();

    // 4. Click 'Upload'.
    await documentsPage.uploadButton.click();
    await expect(documentsPage.message).toHaveText("Uploaded scan.png successfully.");
    await expect(documentsPage.documentsTable).toBeVisible();
    await expect(documentsPage.documentRows).toHaveCount(1);
    const today = new Date().toISOString().slice(0, 10);
    await expect(documentsPage.documentRows.getByRole("cell")).toHaveText(["scan.png", "W-4 Tax Form", "1 KB", today]);
    await expect(documentsPage.noDocuments).not.toBeVisible();
  });
});
