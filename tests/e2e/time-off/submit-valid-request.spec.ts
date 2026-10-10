// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Submit a valid vacation request", async ({ page, timeOffPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html.
    await timeOffPage.goto();
    await expect(timeOffPage.heading).toHaveText("Time off");
    await expect(timeOffPage.balance).toContainText("15 days");
    await expect(timeOffPage.noRequests).toBeVisible();

    // 2. Select Leave type 'Vacation', fill Start date '2027-03-02' (Tuesday), End date '2027-03-04' (Thursday), Reason 'Family trip', then click 'Submit request'.
    await timeOffPage.submitRequest({
      leaveType: "Vacation",
      startDate: "2027-03-02",
      endDate: "2027-03-04",
      reason: "Family trip",
    });
    await expect(timeOffPage.message).toHaveText("Time-off request submitted for 3 days. Status: Pending approval.");
    await expect(timeOffPage.balance).toContainText("12 days");
    await expect(timeOffPage.noRequests).not.toBeVisible();
    await expect(timeOffPage.requestsTable).toBeVisible();
    await expect(timeOffPage.requestRows).toHaveCount(1);
    await expect(timeOffPage.requestRows.getByRole("cell")).toHaveText(["Vacation", "2027-03-02", "2027-03-04", "3", "Pending"]);
  });
});
