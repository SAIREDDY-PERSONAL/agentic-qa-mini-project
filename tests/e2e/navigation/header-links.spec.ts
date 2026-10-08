// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";

test.describe("Header Navigation", () => {
  test("Header links navigate to each page and mark the current link", async ({ page }) => {
    await signIn(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    const pages = [
      { link: "Dashboard", path: "/dashboard.html", heading: "Welcome, Alex Morgan" },
      { link: "Time Off", path: "/time-off.html", heading: "Time off" },
      { link: "Documents", path: "/documents.html", heading: "Documents" },
      { link: "Directory", path: "/directory.html", heading: "Employee directory" },
      { link: "My Profile", path: "/profile.html", heading: "My profile" },
      { link: "HR Assistant", path: "/chat.html", heading: "HR Assistant" },
    ];

    // Checks that only the given link is marked as the current page
    const expectCurrent = async (current: string) => {
      for (const { link } of pages) {
        const locator = nav.getByRole("link", { name: link, exact: true });
        if (link === current) {
          await expect(locator).toHaveAttribute("aria-current", "page");
        } else {
          await expect(locator).not.toHaveAttribute("aria-current", "page");
        }
      }
    };

    // 1. On /dashboard.html, inspect the 'Main' navigation and header
    await page.goto("/dashboard.html");
    await expect(nav.getByRole("link")).toHaveText(pages.map((p) => p.link));
    await expect(page.getByTestId("user-name")).toHaveText("Alex Morgan");
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expectCurrent("Dashboard");

    // 2. Click each link in turn and check URL, level-1 heading, current link and signed-in name.
    for (const { link, path, heading } of pages) {
      await nav.getByRole("link", { name: link, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace(".", "\\.")}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
      await expectCurrent(link);
      await expect(page.getByTestId("user-name")).toHaveText("Alex Morgan");
    }
  });
});
