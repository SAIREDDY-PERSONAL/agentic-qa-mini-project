// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("No results message and clearing the search restores all employees", async ({ page, directoryPage }) => {
    await signIn(page);
    const { resultCount, noResults, employeeRows } = directoryPage;

    // 1. Navigate to /directory.html and type "zzz" into the searchbox.
    await directoryPage.goto();
    await directoryPage.searchFor("zzz");
    await expect(resultCount).toHaveText("Showing 0 of 10 employees");
    await expect(noResults).toBeVisible();
    await expect(noResults).toHaveText("No employees found.");
    await expect(employeeRows).toHaveCount(0);
    await expect(directoryPage.columnHeaders).toHaveCount(5);

    // 2. Clear the searchbox (fill with empty text).
    await directoryPage.searchFor("");
    await expect(resultCount).toHaveText("Showing 10 of 10 employees");
    await expect(noResults).not.toBeVisible();
    await expect(employeeRows).toHaveCount(10);
    await expect(employeeRows.first()).toHaveText(/^Alex Morgan/);
    await expect(employeeRows.last()).toHaveText(/^Emma Wilson/);

    // 3. Type "Design", then clear the searchbox.
    await directoryPage.searchFor("Design");
    await expect(resultCount).toHaveText("Showing 1 of 10 employees");
    await expect(employeeRows).toHaveText([/^Sofia Rossi/]);
    await directoryPage.searchFor("");
    await expect(resultCount).toHaveText("Showing 10 of 10 employees");
    await expect(employeeRows).toHaveCount(10);
  });
});
