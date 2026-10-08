// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: file over 2 MB", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");

    // 1. Navigate to /documents.html and select 'Government ID' in 'Document type'.
    await page.goto("/documents.html");
    await page.getByLabel("Document type").selectOption("Government ID");
    await expect(page.getByLabel("Document type")).toHaveValue("Government ID");

    // 2. Set the 'File' input with { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(3 * 1024 * 1024) } (~3 MB, a valid type but over the limit), then click 'Upload'.
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "big.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(3 * 1024 * 1024),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toBeVisible();
    await expect(message).toHaveText("File is too large. Maximum size is 2 MB.");
    await expect(message).not.toContainText("successfully");
    await expect(noDocuments).toBeVisible();
    await expect(table).not.toBeVisible();
  });
});
