// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Full employee list on load", async ({ page }) => {
    await signIn(page);
    const search = page.getByRole("searchbox", { name: "Search by name or department" });
    const status = page.getByTestId("result-count");
    const noResults = page.getByTestId("no-results");
    const table = page.getByTestId("directory-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Using the seed (signed in as Alex Morgan), navigate to /directory.html.
    await page.goto("/directory.html");
    await expect(page.getByRole("heading", { name: "Employee directory" })).toBeVisible();
    await expect(search).toBeVisible();
    await expect(search).toHaveValue("");
    await expect(status).toHaveText("Showing 10 of 10 employees");
    await expect(noResults).not.toBeVisible();

    // 2. Inspect the table headers and rows.
    await expect(table.getByRole("columnheader")).toHaveText(["Name", "Title", "Department", "Email", "Location"]);
    await expect(dataRows).toHaveCount(10);
    await expect(dataRows).toHaveText([
      /^Alex Morgan/,
      /^Priya Sharma/,
      /^Daniel Kim/,
      /^Maria Lopez/,
      /^James Carter/,
      /^Aisha Bello/,
      /^Tom Nguyen/,
      /^Sofia Rossi/,
      /^Ravi Patel/,
      /^Emma Wilson/,
    ]);
    await expect(dataRows.first().getByRole("cell")).toHaveText([
      "Alex Morgan",
      "Software Engineer",
      "Engineering",
      "alex.morgan@acme-hr.example",
      "New York",
    ]);
  });
});
