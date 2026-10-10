// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject end date before start date", async ({ page, timeOffPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-04', End date '2027-03-02', click 'Submit request'.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({ leaveType: "Vacation", startDate: "2027-03-04", endDate: "2027-03-02" });
    await expect(timeOffPage.message).toHaveText("End date must be on or after the start date.");
    await expect(timeOffPage.balance).toContainText("15 days");
    await expect(timeOffPage.noRequests).toBeVisible();
  });
});
