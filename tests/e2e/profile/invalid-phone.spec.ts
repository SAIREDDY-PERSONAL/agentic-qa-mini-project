// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Invalid phone format is rejected", async ({ page }) => {
    await signIn(page);
    const phone = page.getByLabel("Phone");
    const save = page.getByRole("button", { name: "Save changes" });
    const error = page.getByText("Enter the phone number in the format 555-123-4567.");
    const success = page.getByText("Profile updated successfully.");

    // 1. Navigate to /profile.html, fill Phone with '12345' and click 'Save changes'
    await page.goto("/profile.html");
    await phone.fill("12345");
    await save.click();
    await expect(error).toBeVisible();
    await expect(success).not.toBeVisible();

    // 2. Repeat with other invalid values such as 'abcdefghij' and '5551234567' (optional variants)
    for (const value of ["abcdefghij", "5551234567"]) {
      await phone.fill(value);
      await save.click();
      await expect(error).toBeVisible();
      await expect(success).not.toBeVisible();
    }

    // 3. Reload the page
    await page.reload();
    await expect(phone).toHaveValue("555-010-1042");
  });
});
