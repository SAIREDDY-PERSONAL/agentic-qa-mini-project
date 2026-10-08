// spec: specs/documents.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Documents page", () => {
  test("Validation: no file chosen", async ({ page }) => {
    await signIn(page);
    const noDocuments = page.getByTestId("no-documents");
    const table = page.getByTestId("documents-table");
    const message = page.getByTestId("upload-message");

    // 1. Navigate to /documents.html, select 'Government ID' in 'Document type', choose no file.
    await page.goto("/documents.html");
    await page.getByLabel("Document type").selectOption("Government ID");
    await expect(page.getByLabel("Document type")).toHaveValue("Government ID");

    // 2. Click 'Upload'.
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(message).toBeVisible();
    await expect(message).toHaveText("Choose a file to upload.");
    await expect(message).not.toContainText("successfully");
    await expect(noDocuments).toBeVisible();
    await expect(table).not.toBeVisible();
  });
});
