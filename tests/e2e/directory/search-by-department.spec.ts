// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search by department lists exactly the department members", async ({ page }) => {
    await signIn(page);
    const search = page.getByRole("searchbox", { name: "Search by name or department" });
    const status = page.getByTestId("result-count");
    const table = page.getByTestId("directory-table");
    const dataRows = table.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });

    // 1. Navigate to /directory.html and type "Engineering" into the searchbox.
    await page.goto("/directory.html");
    await search.fill("Engineering");
    await expect(status).toHaveText("Showing 3 of 10 employees");
    await expect(dataRows).toHaveText([/^Alex Morgan/, /^Daniel Kim/, /^Aisha Bello/]);
    await expect(table.getByRole("cell", { name: "Engineering", exact: true })).toHaveCount(3);
    await expect(table.getByRole("cell", { name: "Priya Sharma" })).toHaveCount(0);
    await expect(table.getByRole("cell", { name: "Maria Lopez" })).toHaveCount(0);

    // 2. Replace the text with "Human Resources".
    await search.fill("Human Resources");
    await expect(status).toHaveText("Showing 3 of 10 employees");
    await expect(dataRows).toHaveText([/^Priya Sharma/, /^James Carter/, /^Ravi Patel/]);

    // 3. Replace the text with "Finance".
    await search.fill("Finance");
    await expect(status).toHaveText("Showing 2 of 10 employees");
    await expect(dataRows).toHaveText([/^Maria Lopez/, /^Tom Nguyen/]);
  });
});
