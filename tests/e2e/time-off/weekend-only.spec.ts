// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject a weekend-only date range", async ({ page }) => {
    await signIn(page);

    // 1. Navigate to /time-off.html. Select Leave type 'Personal', Start date '2027-03-06' (Saturday), End date '2027-03-07' (Sunday), click 'Submit request'.
    await page.goto("/time-off.html");
    await page.getByLabel("Leave type").selectOption("Personal");
    await page.getByLabel("Start date").fill("2027-03-06");
    await page.getByLabel("End date").fill("2027-03-07");
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(
      page.getByText("The selected dates fall on a weekend. Choose at least one weekday."),
    ).toBeVisible();
    await expect(page.getByText("Available balance:")).toContainText("15 days");
    await expect(page.getByTestId("requests-table")).not.toBeVisible();
    await expect(page.getByText("You have no time-off requests.")).toBeVisible();
  });
});
