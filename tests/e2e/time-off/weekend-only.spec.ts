// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject a weekend-only date range", async ({ page, timeOffPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Personal', Start date '2027-03-06' (Saturday), End date '2027-03-07' (Sunday), click 'Submit request'.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({ leaveType: "Personal", startDate: "2027-03-06", endDate: "2027-03-07" });
    await expect(timeOffPage.message).toHaveText("The selected dates fall on a weekend. Choose at least one weekday.");
    await expect(timeOffPage.balance).toContainText("15 days");
    await expect(timeOffPage.requestsTable).not.toBeVisible();
    await expect(timeOffPage.noRequests).toBeVisible();
  });
});
