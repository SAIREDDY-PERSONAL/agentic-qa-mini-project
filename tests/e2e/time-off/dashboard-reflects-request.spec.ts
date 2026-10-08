// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Dashboard reflects a submitted request", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html, submit Vacation from '2027-03-02' to '2027-03-04' and wait for 'Time-off request submitted for 3 days. Status: Pending approval.'.
    await page.goto("/time-off.html");
    await page.getByLabel("Leave type").selectOption("Vacation");
    await page.getByLabel("Start date").fill("2027-03-02");
    await page.getByLabel("End date").fill("2027-03-04");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(
      page.getByText("Time-off request submitted for 3 days. Status: Pending approval."),
    ).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("12 days");

    // 2. Click the 'Dashboard' link in the main navigation.
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    const ptoRegion = page
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: "PTO available" }) });
    await expect(ptoRegion).toContainText("12 days");
    await expect(ptoRegion).toContainText("3 days requested of 15");
    const pendingRegion = page
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: "Pending requests" }) });
    await expect(pendingRegion.getByText("1", { exact: true })).toBeVisible();

    // 3. Click the 'View requests' link.
    await page.getByRole("link", { name: "View requests" }).click();
    await expect(page).toHaveURL(/\/time-off\.html$/);
    await expect(page.getByText("Available balance:")).toContainText("12 days");
    const dataRows = page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.getByRole("cell")).toHaveText(["Vacation", "2027-03-02", "2027-03-04", "3", "Pending"]);
  });
});
