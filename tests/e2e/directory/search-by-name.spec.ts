// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search by name shows a single matching row", { tag: "@smoke" }, async ({ page, directoryPage }) => {
    await signIn(page);
    const { resultCount, employeeRows } = directoryPage;

    // 1. Navigate to /directory.html and type "Priya Sharma" into the "Search by name or department" searchbox.
    await directoryPage.goto();
    await directoryPage.searchFor("Priya Sharma");
    await expect(resultCount).toHaveText("Showing 1 of 10 employees");
    await expect(employeeRows).toHaveCount(1);
    await expect(employeeRows.first().getByRole("cell")).toHaveText([
      "Priya Sharma",
      "HR Business Partner",
      "Human Resources",
      "priya.sharma@acme-hr.example",
      "New York",
    ]);
    await expect(directoryPage.cell("Alex Morgan")).toHaveCount(0);
    await expect(directoryPage.cell("Emma Wilson")).toHaveCount(0);
    await expect(directoryPage.noResults).not.toBeVisible();

    // 2. Replace the text with "Emma".
    await directoryPage.searchFor("Emma");
    await expect(resultCount).toHaveText("Showing 1 of 10 employees");
    await expect(employeeRows).toHaveCount(1);
    await expect(employeeRows.first().getByRole("cell")).toHaveText([
      "Emma Wilson",
      "Sales Manager",
      "Sales",
      "emma.wilson@acme-hr.example",
      "Boston",
    ]);
  });
});
