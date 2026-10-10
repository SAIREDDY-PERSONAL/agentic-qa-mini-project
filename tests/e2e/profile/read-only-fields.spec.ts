// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Read-only fields show the user's data and cannot be edited", async ({ page, profilePage }) => {
    await signIn(page);
    const { fullName, employeeId, workEmail } = profilePage;

    // 1. Navigate to /profile.html
    await profilePage.goto();
    await expect(page).toHaveTitle("My Profile - Acme HR Portal");
    await expect(profilePage.heading).toHaveText("My profile");

    // 2. Read the Full name, Employee ID and Work email textboxes
    await expect(fullName).toHaveValue("Alex Morgan");
    await expect(employeeId).toHaveValue("1042");
    await expect(workEmail).toHaveValue("alex.morgan@acme-hr.example");

    // 3. Check that each of the three fields is not editable, and try to fill Full name with 'Someone Else' (expect it to be rejected)
    await expect(fullName).toHaveAttribute("readonly", "");
    await expect(employeeId).toHaveAttribute("readonly", "");
    await expect(workEmail).toHaveAttribute("readonly", "");
    await expect(fullName).not.toBeEditable();
    await expect(employeeId).not.toBeEditable();
    await expect(workEmail).not.toBeEditable();
    await fullName.click();
    await page.keyboard.type("Someone Else");
    await expect(fullName).toHaveValue("Alex Morgan");
    await expect(employeeId).toHaveValue("1042");
    await expect(workEmail).toHaveValue("alex.morgan@acme-hr.example");

    // 4. Check the editable fields
    await expect(profilePage.phone).toBeEditable();
    await expect(profilePage.homeAddress).toBeEditable();
    await expect(profilePage.saveButton).toBeVisible();
  });
});
