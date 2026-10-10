// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject a request exceeding the available balance", async ({ page, timeOffPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-01' (Monday), End date '2027-03-26' (Friday; 4 full weeks = 20 weekdays), click 'Submit request'.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({ leaveType: "Vacation", startDate: "2027-03-01", endDate: "2027-03-26" });
    await expect(timeOffPage.message).toHaveText(
      "Insufficient PTO balance: you requested 20 days but only 15 are available.",
    );
    await expect(timeOffPage.balance).toContainText("15 days");
    await expect(timeOffPage.requestsTable).not.toBeVisible();
    await expect(timeOffPage.noRequests).toBeVisible();
  });
});
