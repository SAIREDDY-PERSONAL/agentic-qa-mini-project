// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: no file chosen", async ({ page, documentsPage }) => {
    await signIn(page);

    // 1. Navigate to /documents.html, select 'Government ID' in 'Document type', choose no file.
    await documentsPage.goto();
    await documentsPage.selectType("Government ID");
    await expect(documentsPage.documentType).toHaveValue("Government ID");

    // 2. Click 'Upload'.
    await documentsPage.uploadButton.click();
    await expect(documentsPage.message).toBeVisible();
    await expect(documentsPage.message).toHaveText("Choose a file to upload.");
    await expect(documentsPage.message).not.toContainText("successfully");
    await expect(documentsPage.noDocuments).toBeVisible();
    await expect(documentsPage.documentsTable).not.toBeVisible();
  });
});
