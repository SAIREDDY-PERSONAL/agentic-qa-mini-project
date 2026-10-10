// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Invalid phone format is rejected", async ({ page, profilePage }) => {
    await signIn(page);

    // 1. Navigate to /profile.html, fill Phone with '12345' and click 'Save changes'
    await profilePage.goto();
    await profilePage.updateContactDetails({ phone: "12345" });
    await expect(profilePage.phoneError).toBeVisible();
    await expect(profilePage.successMessage).not.toBeVisible();

    // 2. Repeat with other invalid values such as 'abcdefghij' and '5551234567' (optional variants)
    for (const phone of ["abcdefghij", "5551234567"]) {
      await profilePage.updateContactDetails({ phone });
      await expect(profilePage.phoneError).toBeVisible();
      await expect(profilePage.successMessage).not.toBeVisible();
    }

    // 3. Reload the page
    await page.reload();
    await expect(profilePage.phone).toHaveValue("555-010-1042");
  });
});
