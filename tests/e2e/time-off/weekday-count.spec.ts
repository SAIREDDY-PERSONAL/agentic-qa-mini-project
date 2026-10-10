// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Weekend days are excluded from the day count", async ({ page, timeOffPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Sick', Start date '2027-03-05' (Friday), End date '2027-03-09' (Tuesday), click 'Submit request'. Range spans Fri, Sat, Sun, Mon, Tue = 3 weekdays.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({ leaveType: "Sick", startDate: "2027-03-05", endDate: "2027-03-09" });
    await expect(timeOffPage.message).toHaveText("Time-off request submitted for 3 days. Status: Pending approval.");
    await expect(timeOffPage.balance).toContainText("12 days");
    await expect(timeOffPage.requestRows).toHaveCount(1);
    await expect(timeOffPage.requestRows.getByRole("cell")).toHaveText(["Sick", "2027-03-05", "2027-03-09", "3", "Pending"]);
  });
});
