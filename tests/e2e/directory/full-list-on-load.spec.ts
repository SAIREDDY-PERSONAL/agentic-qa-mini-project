// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Full employee list on load", async ({ page, directoryPage }) => {
    await signIn(page);

    // 1. Using the seed (signed in as Alex Morgan), navigate to /directory.html.
    await directoryPage.goto();
    await expect(directoryPage.heading).toHaveText("Employee directory");
    await expect(directoryPage.search).toBeVisible();
    await expect(directoryPage.search).toHaveValue("");
    await expect(directoryPage.resultCount).toHaveText("Showing 10 of 10 employees");
    await expect(directoryPage.noResults).not.toBeVisible();

    // 2. Inspect the table headers and rows.
    await expect(directoryPage.columnHeaders).toHaveText(["Name", "Title", "Department", "Email", "Location"]);
    await expect(directoryPage.employeeRows).toHaveCount(10);
    await expect(directoryPage.employeeRows).toHaveText([
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
    await expect(directoryPage.employeeRows.first().getByRole("cell")).toHaveText([
      "Alex Morgan",
      "Software Engineer",
      "Engineering",
      "alex.morgan@acme-hr.example",
      "New York",
    ]);
  });
});
