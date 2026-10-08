// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Read-only fields show the user's data and cannot be edited", async ({ page }) => {
    await signIn(page);
    const fullName = page.getByLabel("Full name");
    const employeeId = page.getByLabel("Employee ID");
    const workEmail = page.getByLabel("Work email");

    // 1. Navigate to /profile.html
    await page.goto("/profile.html");
    await expect(page).toHaveTitle("My Profile - Acme HR Portal");
    await expect(page.getByRole("heading", { name: "My profile", level: 1 })).toBeVisible();

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
    await expect(page.getByLabel("Phone")).toBeEditable();
    await expect(page.getByLabel("Home address")).toBeEditable();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
