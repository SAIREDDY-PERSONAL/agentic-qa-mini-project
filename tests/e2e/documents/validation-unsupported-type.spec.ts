// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: unsupported file type", async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html and select 'Certification' in 'Document type'.
    await documentsPage.goto();
    await documentsPage.selectType("Certification");
    await expect(documentsPage.documentType).toHaveValue("Certification");

    // 2. Set the 'File' input with { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') } (~5 bytes), then click 'Upload'.
    await documentsPage.upload({
      file: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    });
    await expect(documentsPage.message).toBeVisible();
    await expect(documentsPage.message).toHaveText("Unsupported file type. Upload a PDF, PNG, or JPG.");
    await expect(documentsPage.message).not.toContainText("successfully");
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.documentsTable).not.toBeVisible();
  });
});
