// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: no document type selected", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");

    // 1. Navigate to /documents.html and leave 'Document type' on 'Select a type'.
    await page.goto("/documents.html");
    await expect(page.getByLabel("Document type")).toHaveValue("");
    await expect(noDocuments).toBeVisible();

    // 2. Set the 'File' input with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB), then click 'Upload'.
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "id-card.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(2048, 1),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toBeVisible();
    await expect(message).toHaveText("Select a document type.");
    await expect(message).not.toContainText("successfully");
    await expect(noDocuments).toBeVisible();
    await expect(table).not.toBeVisible();
  });
});
