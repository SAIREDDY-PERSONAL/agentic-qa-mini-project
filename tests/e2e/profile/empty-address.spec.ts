// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Empty home address is rejected", async ({ page }) => {
    await signIn(page);
    const address = page.getByLabel("Home address");

    // 1. Navigate to /profile.html, clear Home address (leave Phone valid) and click 'Save changes'
    await page.goto("/profile.html");
    await address.fill("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Home address is required.")).toBeVisible();
    await expect(page.getByText("Profile updated successfully.")).not.toBeVisible();

    // 2. Reload the page
    await page.reload();
    await expect(address).toHaveValue("12 Main St, New York, NY 10001");
  });
});
