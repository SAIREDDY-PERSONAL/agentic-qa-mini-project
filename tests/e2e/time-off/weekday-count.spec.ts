// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Weekend days are excluded from the day count", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Sick', Start date '2027-03-05' (Friday), End date '2027-03-09' (Tuesday), click 'Submit request'. Range spans Fri, Sat, Sun, Mon, Tue = 3 weekdays.
    await page.goto("/time-off.html");
    await page.getByLabel("Leave type").selectOption("Sick");
    await page.getByLabel("Start date").fill("2027-03-05");
    await page.getByLabel("End date").fill("2027-03-09");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(
      page.getByText("Time-off request submitted for 3 days. Status: Pending approval."),
    ).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("12 days");
    const dataRows = page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.getByRole("cell")).toHaveText(["Sick", "2027-03-05", "2027-03-09", "3", "Pending"]);
  });
});
