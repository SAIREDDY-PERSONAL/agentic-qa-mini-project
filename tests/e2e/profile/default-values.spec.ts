// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Default editable values are pre-filled", async ({ page, profilePage }) => {
    await signIn(page);

    // 1. Navigate to /profile.html
    await profilePage.goto();
    await expect(profilePage.phone).toHaveValue("555-010-1042");
    await expect(profilePage.phone).toHaveAttribute("placeholder", "e.g. 555-123-4567");
    await expect(profilePage.homeAddress).toHaveValue("12 Main St, New York, NY 10001");
    await expect(profilePage.message).not.toBeVisible();
    await expect(profilePage.successMessage).not.toBeVisible();
    await expect(profilePage.phoneError).not.toBeVisible();
    await expect(profilePage.addressError).not.toBeVisible();
  });
});
