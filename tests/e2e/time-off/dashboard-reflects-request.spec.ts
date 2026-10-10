// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Dashboard reflects a submitted request", async ({ page, timeOffPage, dashboardPage }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html, submit Vacation from '2027-03-02' to '2027-03-04' and wait for 'Time-off request submitted for 3 days. Status: Pending approval.'.
    await timeOffPage.goto();
    await timeOffPage.submitRequest({ leaveType: "Vacation", startDate: "2027-03-02", endDate: "2027-03-04" });
    await expect(timeOffPage.message).toHaveText("Time-off request submitted for 3 days. Status: Pending approval.");
    await expect(timeOffPage.balance).toContainText("12 days");

    // 2. Click the 'Dashboard' link in the main navigation.
    await timeOffPage.navigateTo("Dashboard");
    await expect(dashboardPage.heading).toHaveText("Welcome, Alex Morgan");
    await expect(dashboardPage.ptoCard).toContainText("12 days");
    await expect(dashboardPage.ptoCard).toContainText("3 days requested of 15");
    await expect(dashboardPage.pendingCard.getByText("1", { exact: true })).toBeVisible();

    // 3. Click the 'View requests' link.
    await dashboardPage.viewRequestsLink.click();
    await expect(page).toHaveURL(/\/time-off\.html$/);
    await expect(timeOffPage.balance).toContainText("12 days");
    await expect(timeOffPage.requestRows).toHaveCount(1);
    await expect(timeOffPage.requestRows.getByRole("cell")).toHaveText(["Vacation", "2027-03-02", "2027-03-04", "3", "Pending"]);
  });
});
