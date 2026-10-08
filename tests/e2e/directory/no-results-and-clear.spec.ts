// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("No results message and clearing the search restores all employees", async ({ page }) => {
    await signIn(page);
    const search = page.getByRole("searchbox", { name: "Search by name or department" });
    const status = page.getByTestId("result-count");
    const noResults = page.getByTestId("no-results");
    const table = page.getByTestId("directory-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /directory.html and type "zzz" into the searchbox.
    await page.goto("/directory.html");
    await search.fill("zzz");
    await expect(status).toHaveText("Showing 0 of 10 employees");
    await expect(noResults).toBeVisible();
    await expect(noResults).toHaveText("No employees found.");
    await expect(dataRows).toHaveCount(0);
    await expect(table.getByRole("columnheader")).toHaveCount(5);

    // 2. Clear the searchbox (fill with empty text).
    await search.fill("");
    await expect(status).toHaveText("Showing 10 of 10 employees");
    await expect(noResults).not.toBeVisible();
    await expect(dataRows).toHaveCount(10);
    await expect(dataRows.first()).toHaveText(/^Alex Morgan/);
    await expect(dataRows.last()).toHaveText(/^Emma Wilson/);

    // 3. Type "Design", then clear the searchbox.
    await search.fill("Design");
    await expect(status).toHaveText("Showing 1 of 10 employees");
    await expect(dataRows).toHaveText([/^Sofia Rossi/]);
    await search.fill("");
    await expect(status).toHaveText("Showing 10 of 10 employees");
    await expect(dataRows).toHaveCount(10);
  });
});
