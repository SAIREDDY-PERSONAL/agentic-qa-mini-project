// spec: specs/documents.md
//
// DELIBERATELY WEAK TEST, used only by `npm run judge:demo` (excluded from normal runs by the
// @judge-demo tag). It checks only the success message, like a hastily written test, so with
// BUGS=upload it still passes even though the document is never saved. The independent UI judge
// compares the final page with the plan's expected results and should fail it.
// The properly written version is tests/e2e/documents/upload-pdf.spec.ts.
import { test, expect, signIn } from "../fixtures.js";

test.describe("Documents page", () => {
  test("Upload a PDF successfully", { tag: "@judge-demo" }, async ({ page }) => {
    await signIn(page);
    await page.goto("/documents.html");

    await page.getByLabel("Document type").selectOption("Government ID");
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "id-card.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(2048, 1),
    });
    await page.getByRole("button", { name: "Upload" }).click();

    // Weak: the only check is the message
    await expect(page.getByRole("status").filter({ hasText: "Uploaded id-card.pdf successfully." })).toBeVisible();
  });
});
