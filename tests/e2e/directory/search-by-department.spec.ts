// spec: specs/directory.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Employee Directory", () => {
  test("Search by department lists exactly the department members", async ({ page, directoryPage }) => {
    await signIn(page);
    const { resultCount, employeeRows } = directoryPage;

    // 1. Navigate to /directory.html and type "Engineering" into the searchbox.
    await directoryPage.goto();
    await directoryPage.searchFor("Engineering");
    await expect(resultCount).toHaveText("Showing 3 of 10 employees");
    await expect(employeeRows).toHaveText([/^Alex Morgan/, /^Daniel Kim/, /^Aisha Bello/]);
    await expect(directoryPage.cell("Engineering")).toHaveCount(3);
    await expect(directoryPage.cell("Priya Sharma")).toHaveCount(0);
    await expect(directoryPage.cell("Maria Lopez")).toHaveCount(0);

    // 2. Replace the text with "Human Resources".
    await directoryPage.searchFor("Human Resources");
    await expect(resultCount).toHaveText("Showing 3 of 10 employees");
    await expect(employeeRows).toHaveText([/^Priya Sharma/, /^James Carter/, /^Ravi Patel/]);

    // 3. Replace the text with "Finance".
    await directoryPage.searchFor("Finance");
    await expect(resultCount).toHaveText("Showing 2 of 10 employees");
    await expect(employeeRows).toHaveText([/^Maria Lopez/, /^Tom Nguyen/]);
  });
});
