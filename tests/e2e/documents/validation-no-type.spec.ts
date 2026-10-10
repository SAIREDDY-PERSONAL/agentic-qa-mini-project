// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: no document type selected", async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html and leave 'Document type' on 'Select a type'.
    await documentsPage.goto();
    await expect(documentsPage.documentType).toHaveValue("");
    await expect(documentsPage.noDocuments).toBeVisible();

    // 2. Set the 'File' input with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB), then click 'Upload'.
    await documentsPage.upload({
      file: { name: "id-card.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(2048, 1) },
    });
    await expect(documentsPage.message).toBeVisible();
    await expect(documentsPage.message).toHaveText("Select a document type.");
    await expect(documentsPage.message).not.toContainText("successfully");
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.documentsTable).not.toBeVisible();
  });
});
