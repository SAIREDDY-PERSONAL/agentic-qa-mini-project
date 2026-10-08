// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject a request exceeding the available balance", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-01' (Monday), End date '2027-03-26' (Friday; 4 full weeks = 20 weekdays), click 'Submit request'.
    await page.goto("/time-off.html");
    await page.getByLabel("Leave type").selectOption("Vacation");
    await page.getByLabel("Start date").fill("2027-03-01");
    await page.getByLabel("End date").fill("2027-03-26");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(
      page.getByText("Insufficient PTO balance: you requested 20 days but only 15 are available."),
    ).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("15 days");
    await expect(page.getByTestId("requests-table")).not.toBeVisible();
    await expect(page.getByText("You have no time-off requests.")).toBeVisible();
  });
});
