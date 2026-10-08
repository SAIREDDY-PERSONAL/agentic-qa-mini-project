// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Default editable values are pre-filled", async ({ page }) => {
    await signIn(page);
    const phone = page.getByLabel("Phone");
    const message = page.getByTestId("profile-message");

    // 1. Navigate to /profile.html
    await page.goto("/profile.html");
    await expect(phone).toHaveValue("555-010-1042");
    await expect(phone).toHaveAttribute("placeholder", "e.g. 555-123-4567");
    await expect(page.getByLabel("Home address")).toHaveValue("12 Main St, New York, NY 10001");
    await expect(message).not.toBeVisible();
    await expect(page.getByText("Profile updated successfully.")).not.toBeVisible();
    await expect(page.getByText("Enter the phone number in the format 555-123-4567.")).not.toBeVisible();
    await expect(page.getByText("Home address is required.")).not.toBeVisible();
  });
});
