// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject end date before start date", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-04', End date '2027-03-02', click 'Submit request'.
    await page.goto("/time-off.html");
    await page.getByLabel("Leave type").selectOption("Vacation");
    await page.getByLabel("Start date").fill("2027-03-04");
    await page.getByLabel("End date").fill("2027-03-02");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(page.getByText("End date must be on or after the start date.")).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("15 days");
    await expect(page.getByText("You have no time-off requests.")).toBeVisible();
  });
});
