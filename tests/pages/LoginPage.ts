import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

// Read from the environment; never hard-code credentials in a test
export const demoCredentials = {
  username: process.env.DEMO_USERNAME ?? "demo",
  password: process.env.DEMO_PASSWORD ?? "demo123",
};

export class LoginPage extends BasePage {
  readonly path = "/login.html";
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;
  readonly error: Locator;
  readonly loggedOutMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByLabel("Username");
    this.password = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    this.error = page.getByRole("alert");
    this.loggedOutMessage = page.getByText("You have been logged out.");
  }

  async fillCredentials(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async signIn(username = demoCredentials.username, password = demoCredentials.password) {
    await this.fillCredentials(username, password);
    await this.signInButton.click();
  }
}
