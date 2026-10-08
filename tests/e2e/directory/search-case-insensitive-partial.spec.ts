// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search is case-insensitive and matches partial text", async ({ page }) => {
    await signIn(page);
    const search = page.getByRole("searchbox", { name: "Search by name or department" });
    const status = page.getByTestId("result-count");
    const table = page.getByTestId("directory-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /directory.html and type "AISHA" (upper case).
    await page.goto("/directory.html");
    await search.fill("AISHA");
    await expect(status).toHaveText("Showing 1 of 10 employees");
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.first().getByRole("cell")).toHaveText([
      "Aisha Bello",
      "QA Engineer",
      "Engineering",
      "aisha.bello@acme-hr.example",
      "Austin",
    ]);

    // 2. Replace the text with "fin" (partial, lower case department prefix).
    await search.fill("fin");
    await expect(status).toHaveText("Showing 2 of 10 employees");
    await expect(dataRows).toHaveText([/^Maria Lopez/, /^Tom Nguyen/]);
    await expect(table.getByRole("cell", { name: "Finance", exact: true })).toHaveCount(2);

    // 3. Replace the text with "sALES" (mixed case).
    await search.fill("sALES");
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
