// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("My Profile", () => {
  test("Save valid changes and confirm they persist after reload", async ({ page }) => {
    await signIn(page);
    const phone = page.getByLabel("Phone");
    const address = page.getByLabel("Home address");

    // 1. Navigate to /profile.html, fill Phone with '555-123-4567' and Home address with '99 Oak Ave, Austin, TX 78701'
    await page.goto("/profile.html");
    await phone.fill("555-123-4567");
    await address.fill("99 Oak Ave, Austin, TX 78701");
    await expect(phone).toHaveValue("555-123-4567");
    await expect(address).toHaveValue("99 Oak Ave, Austin, TX 78701");

    // 2. Click 'Save changes'
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile updated successfully.")).toBeVisible();

    // 3. Reload the page
    await page.reload();
    await expect(phone).toHaveValue("555-123-4567");
    await expect(address).toHaveValue("99 Oak Ave, Austin, TX 78701");
    await expect(page.getByLabel("Full name")).toHaveValue("Alex Morgan");
    await expect(page.getByLabel("Employee ID")).toHaveValue("1042");
    await expect(page.getByLabel("Work email")).toHaveValue("alex.morgan@acme-hr.example");
  });
});
