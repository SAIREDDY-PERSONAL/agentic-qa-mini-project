// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search by name shows a single matching row", async ({ page }) => {
    await signIn(page);
    const search = page.getByRole("searchbox", { name: "Search by name or department" });
    const status = page.getByTestId("result-count");
    const noResults = page.getByTestId("no-results");
    const table = page.getByTestId("directory-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /directory.html and type "Priya Sharma" into the "Search by name or department" searchbox.
    await page.goto("/directory.html");
    await search.fill("Priya Sharma");
    await expect(status).toHaveText("Showing 1 of 10 employees");
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.first().getByRole("cell")).toHaveText([
      "Priya Sharma",
      "HR Business Partner",
      "Human Resources",
      "priya.sharma@acme-hr.example",
      "New York",
    ]);
    await expect(table.getByRole("cell", { name: "Alex Morgan" })).toHaveCount(0);
    await expect(table.getByRole("cell", { name: "Emma Wilson" })).toHaveCount(0);
    await expect(noResults).not.toBeVisible();

    // 2. Replace the text with "Emma".
    await search.fill("Emma");
    await expect(status).toHaveText("Showing 1 of 10 employees");
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.first().getByRole("cell")).toHaveText([
      "Emma Wilson",
      "Sales Manager",
      "Sales",
      "emma.wilson@acme-hr.example",
      "Boston",
    ]);
  });
});
