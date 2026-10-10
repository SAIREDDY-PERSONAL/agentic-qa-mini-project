// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: file over 2 MB", async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html and select 'Government ID' in 'Document type'.
    await documentsPage.goto();
    await documentsPage.selectType("Government ID");
    await expect(documentsPage.documentType).toHaveValue("Government ID");

    // 2. Set the 'File' input with { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(3 * 1024 * 1024) } (~3 MB, a valid type but over the limit), then click 'Upload'.
    await documentsPage.upload({
      file: { name: "big.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(3 * 1024 * 1024) },
    });
    await expect(documentsPage.message).toBeVisible();
    await expect(documentsPage.message).toHaveText("File is too large. Maximum size is 2 MB.");
    await expect(documentsPage.message).not.toContainText("successfully");
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.documentsTable).not.toBeVisible();
  });
});
