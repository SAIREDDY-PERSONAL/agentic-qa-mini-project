// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Submit a valid vacation request", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html.
    await page.goto("/time-off.html");
    await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("15 days");
    await expect(page.getByText("You have no time-off requests.")).toBeVisible();

    // 2. Select Leave type 'Vacation', fill Start date '2027-03-02' (Tuesday), End date '2027-03-04' (Thursday), Reason 'Family trip', then click 'Submit request'.
    await page.getByLabel("Leave type").selectOption("Vacation");
    await page.getByLabel("Start date").fill("2027-03-02");
    await page.getByLabel("End date").fill("2027-03-04");
    await page.getByLabel("Reason (optional)").fill("Family trip");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(
      page.getByText("Time-off request submitted for 3 days. Status: Pending approval."),
    ).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("12 days");
    await expect(page.getByText("You have no time-off requests.")).not.toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    const dataRows = page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
    await expect(dataRows).toHaveCount(1);
    const cells = dataRows.getByRole("cell");
    await expect(cells).toHaveText(["Vacation", "2027-03-02", "2027-03-04", "3", "Pending"]);
  });
});
