// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject submission with missing required fields", async ({ page, timeOffPage }) => {
    await signIn(page);
    const message = "Select a leave type, start date, and end date.";

    // 1. Navigate to /time-off.html and click 'Submit request' without filling anything.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({});
    await expect(timeOffPage.message).toHaveText(message);
    await expect(timeOffPage.balance).toContainText("15 days");
    await expect(timeOffPage.noRequests).toBeVisible();

    // 2. Select Leave type 'Sick' and fill only Start date '2027-03-02' (leave End date empty), then click 'Submit request'.
    await timeOffPage.submitRequest({ leaveType: "Sick", startDate: "2027-03-02" });
    await expect(timeOffPage.message).toHaveText(message);
    await expect(timeOffPage.requestsTable).not.toBeVisible();
    await expect(timeOffPage.noRequests).toBeVisible();
    await expect(timeOffPage.balance).toContainText("15 days");
  });
});
