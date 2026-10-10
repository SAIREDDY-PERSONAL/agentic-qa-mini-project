import type { Locator, Page } from "@playwright/test";

export type NavLinkName = "Dashboard" | "Time Off" | "Documents" | "Directory" | "My Profile" | "HR Assistant";

// Shared by every page of the portal: the header (main navigation, signed-in name, Log out)
// and the page's level-1 heading.
export abstract class BasePage {
  abstract readonly path: string;
  readonly heading: Locator;
  readonly mainNav: Locator;
  readonly navLinks: Locator;
  readonly userName: Locator;
  readonly logOutButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { level: 1 });
    this.mainNav = page.getByRole("navigation", { name: "Main" });
    this.navLinks = this.mainNav.getByRole("link");
    this.userName = page.getByTestId("user-name");
    this.logOutButton = page.getByRole("button", { name: "Log out" });
  }

  // `search` is appended to the page's path, e.g. "?next=%2Fdocuments.html"
  async goto(search = "") {
    await this.page.goto(`${this.path}${search}`);
  }

  navLink(name: NavLinkName) {
    return this.mainNav.getByRole("link", { name, exact: true });
  }

  async navigateTo(name: NavLinkName) {
    await this.navLink(name).click();
  }

  async logOut() {
    await this.logOutButton.click();
  }

  // Body rows of a table, excluding its header row
  protected dataRows(table: Locator) {
    return table.getByRole("row").filter({ hasNot: this.page.getByRole("columnheader") });
  }
}
