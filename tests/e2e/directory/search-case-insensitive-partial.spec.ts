// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search is case-insensitive and matches partial text", async ({ page, directoryPage }) => {
    await signIn(page);
    const { resultCount, employeeRows } = directoryPage;

    // 1. Navigate to /directory.html and type "AISHA" (upper case).
    await directoryPage.goto();
    await directoryPage.searchFor("AISHA");
    await expect(resultCount).toHaveText("Showing 1 of 10 employees");
    await expect(employeeRows).toHaveCount(1);
    await expect(employeeRows.first().getByRole("cell")).toHaveText([
      "Aisha Bello",
      "QA Engineer",
      "Engineering",
      "aisha.bello@acme-hr.example",
      "Austin",
    ]);

    // 2. Replace the text with "fin" (partial, lower case department prefix).
    await directoryPage.searchFor("fin");
    await expect(resultCount).toHaveText("Showing 2 of 10 employees");
    await expect(employeeRows).toHaveText([/^Maria Lopez/, /^Tom Nguyen/]);
    await expect(directoryPage.cell("Finance")).toHaveCount(2);

    // 3. Replace the text with "sALES" (mixed case).
    await directoryPage.searchFor("sALES");
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
