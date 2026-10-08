// spec: specs/time-off.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Time off requests", () => {
  test("Reject submission with missing required fields", async ({ page }) => {
    await signIn(page);
    const message = "Select a leave type, start date, and end date.";
    const submit = page.getByRole("button", { name: "Submit request" });
    const balance = page.getByText("Available balance:");
    const noRequests = page.getByText("You have no time-off requests.");

    // 1. Navigate to /time-off.html and click 'Submit request' without filling anything.
    await page.goto("/time-off.html");
    await submit.click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(balance).toContainText("15 days");
    await expect(noRequests).toBeVisible();

    // 2. Select Leave type 'Sick' and fill only Start date '2027-03-02' (leave End date empty), then click 'Submit request'.
    await page.getByLabel("Leave type").selectOption("Sick");
    await page.getByLabel("Start date").fill("2027-03-02");
    await submit.click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByTestId("requests-table")).not.toBeVisible();
    await expect(noRequests).toBeVisible();
    await expect(balance).toContainText("15 days");
  });
});
