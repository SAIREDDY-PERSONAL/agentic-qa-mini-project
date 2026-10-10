// spec: specs/profile-and-navigation.md
// seed: tests/seed.spec.ts
import { test, expect, signIn } from "../../fixtures.js";
import type { NavLinkName } from "../../pages/index.js";

test.describe("Header Navigation", () => {
  test("Header links navigate to each page and mark the current link", { tag: "@smoke" }, async ({ page, dashboardPage }) => {
    await signIn(page);
    // The header is the same on every page, so the dashboard page object covers all of them
    const header = dashboardPage;
    const pages: { link: NavLinkName; path: string; heading: string }[] = [
      { link: "Dashboard", path: "/dashboard.html", heading: "Welcome, Alex Morgan" },
      { link: "Time Off", path: "/time-off.html", heading: "Time off" },
      { link: "Documents", path: "/documents.html", heading: "Documents" },
      { link: "Directory", path: "/directory.html", heading: "Employee directory" },
      { link: "My Profile", path: "/profile.html", heading: "My profile" },
      { link: "HR Assistant", path: "/chat.html", heading: "HR Assistant" },
    ];

    // Checks that only the given link is marked as the current page
    const expectCurrent = async (current: NavLinkName) => {
      for (const { link } of pages) {
        if (link === current) {
          await expect(header.navLink(link)).toHaveAttribute("aria-current", "page");
        } else {
          await expect(header.navLink(link)).not.toHaveAttribute("aria-current", "page");
        }
      }
    };

    // 1. On /dashboard.html, inspect the 'Main' navigation and header
    await dashboardPage.goto();
    await expect(header.navLinks).toHaveText(pages.map((p) => p.link));
    await expect(header.userName).toHaveText("Alex Morgan");
    await expect(header.logOutButton).toBeVisible();
    await expectCurrent("Dashboard");

    // 2. Click each link in turn and check URL, level-1 heading, current link and signed-in name.
    for (const { link, path, heading } of pages) {
      await header.navigateTo(link);
      await expect(page).toHaveURL(new RegExp(`${path.replace(".", "\\.")}$`));
      await expect(header.heading).toHaveText(heading);
      await expectCurrent(link);
      await expect(header.userName).toHaveText("Alex Morgan");
    }
  });
});
