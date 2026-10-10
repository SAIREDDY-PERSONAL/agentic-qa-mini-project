// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Empty home address is rejected", async ({ page, profilePage }) => {
    await signIn(page);

    // 1. Navigate to /profile.html, clear Home address (leave Phone valid) and click 'Save changes'
    await profilePage.goto();
    await profilePage.updateContactDetails({ homeAddress: "" });
    await expect(profilePage.addressError).toBeVisible();
    await expect(profilePage.successMessage).not.toBeVisible();

    // 2. Reload the page
    await page.reload();
    await expect(profilePage.homeAddress).toHaveValue("12 Main St, New York, NY 10001");
  });
});
