// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Upload an image (PNG) successfully", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /documents.html.
    await page.goto("/documents.html");
    await expect(noDocuments).toBeVisible();
    await expect(noDocuments).toHaveText("No documents uploaded yet.");

    // 2. Select 'W-4 Tax Form' in 'Document type'.
    await page.getByLabel("Document type").selectOption("W-4 Tax Form");
    await expect(page.getByLabel("Document type")).toHaveValue("W-4 Tax Form");

    // 3. Set the 'File' input via setInputFiles with { name: 'scan.png', mimeType: 'image/png', buffer: Buffer.alloc(1024, 1) } (~1 KB).
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "scan.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(1024, 1),
    });
    await expect(message).not.toBeVisible();

    // 4. Click 'Upload'.
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toHaveText("Uploaded scan.png successfully.");
    await expect(table).toBeVisible();
    await expect(dataRows).toHaveCount(1);
    const today = new Date().toISOString().slice(0, 10);
    await expect(dataRows.getByRole("cell")).toHaveText(["scan.png", "W-4 Tax Form", "1 KB", today]);
    await expect(noDocuments).not.toBeVisible();
  });
});
