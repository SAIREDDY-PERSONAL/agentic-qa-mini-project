import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
    browserName: "chromium",
    // Screenshot at the end of every test, shown in the HTML report (and used by the judge)
    screenshot: "on",
    // Full trace for failed tests, for debugging and the healer agent
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node app/server.mjs",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});