// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: unsupported file type", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");

    // 1. Navigate to /documents.html and select 'Certification' in 'Document type'.
    await page.goto("/documents.html");
    await page.getByLabel("Document type").selectOption("Certification");
    await expect(page.getByLabel("Document type")).toHaveValue("Certification");

    // 2. Set the 'File' input with { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') } (~5 bytes), then click 'Upload'.
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toBeVisible();
    await expect(message).toHaveText("Unsupported file type. Upload a PDF, PNG, or JPG.");
    await expect(message).not.toContainText("successfully");
    await expect(noDocuments).toBeVisible();
    await expect(table).not.toBeVisible();
  });
});
