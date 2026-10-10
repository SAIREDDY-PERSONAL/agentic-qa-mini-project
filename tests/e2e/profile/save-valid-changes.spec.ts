// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Save valid changes and confirm they persist after reload", async ({ page, profilePage }) => {
    await signIn(page);
    const { phone, homeAddress } = profilePage;

    // 1. Navigate to /profile.html, fill Phone with '555-123-4567' and Home address with '99 Oak Ave, Austin, TX 78701'
    await profilePage.goto();
    await phone.fill("555-123-4567");
    await homeAddress.fill("99 Oak Ave, Austin, TX 78701");
    await expect(phone).toHaveValue("555-123-4567");
    await expect(homeAddress).toHaveValue("99 Oak Ave, Austin, TX 78701");

    // 2. Click 'Save changes'
    await profilePage.save();
    await expect(profilePage.successMessage).toBeVisible();

    // 3. Reload the page
    await page.reload();
    await expect(phone).toHaveValue("555-123-4567");
    await expect(homeAddress).toHaveValue("99 Oak Ave, Austin, TX 78701");
    await expect(profilePage.fullName).toHaveValue("Alex Morgan");
    await expect(profilePage.employeeId).toHaveValue("1042");
    await expect(profilePage.workEmail).toHaveValue("alex.morgan@acme-hr.example");
  });
});
