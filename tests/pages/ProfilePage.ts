import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class ProfilePage extends BasePage {
  readonly path = "/profile.html";
  readonly fullName: Locator;
  readonly employeeId: Locator;
  readonly workEmail: Locator;
  readonly phone: Locator;
  readonly homeAddress: Locator;
  readonly saveButton: Locator;
  readonly message: Locator;
  readonly successMessage: Locator;
  readonly phoneError: Locator;
  readonly addressError: Locator;

  constructor(page: Page) {
    super(page);
    this.fullName = page.getByLabel("Full name");
    this.employeeId = page.getByLabel("Employee ID");
    this.workEmail = page.getByLabel("Work email");
    this.phone = page.getByLabel("Phone");
    this.homeAddress = page.getByLabel("Home address");
    this.saveButton = page.getByRole("button", { name: "Save changes" });
    this.message = page.getByTestId("profile-message");
    this.successMessage = page.getByText("Profile updated successfully.");
    this.phoneError = page.getByText("Enter the phone number in the format 555-123-4567.");
    this.addressError = page.getByText("Home address is required.");
  }

  async save() {
    await this.saveButton.click();
  }

  // Fills only the given fields, then saves
  async updateContactDetails({ phone, homeAddress }: { phone?: string; homeAddress?: string }) {
    if (phone !== undefined) await this.phone.fill(phone);
    if (homeAddress !== undefined) await this.homeAddress.fill(homeAddress);
    await this.save();
  }
}
