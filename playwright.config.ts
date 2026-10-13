import { defineConfig, devices, type Project } from "@playwright/test";

// PORT and BUGS are passed through to app/server.mjs, e.g. PORT=8093 BUGS=upload
const PORT = Number(process.env.PORT ?? 8080);
const BASE_URL = `http://localhost:${PORT}`;

// tests/judge-demo holds deliberately weak tests that only run in the judge demo (npm run judge:demo)
const judgeDemo = process.env.JUDGE_DEMO ? [] : [/@judge-demo/];
// The chatbot suite makes one paid judge call per test and does not depend on the browser,
// so it runs on Chromium only. The UI judge (UI_JUDGE=1) is kept to Chromium by its npm scripts.
const chromiumOnly = [/@chat-agent/];

const browser = (name: string, use: Project["use"], chromium = false): Project => ({
  name,
  use,
  grepInvert: chromium ? judgeDemo : [...judgeDemo, ...chromiumOnly],
});

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    // Screenshot at the end of every test, shown in the HTML report (and used by the judge)
    screenshot: "on",
    // Full trace for failed tests, for debugging and the healer agent
    trace: "retain-on-failure",
  },
  // Run one browser with --project, e.g. npx playwright test --project=firefox.
  // Browsers come from `npx playwright install`; CI installs and runs Chromium only.
  projects: [
    browser("chromium", { ...devices["Desktop Chrome"] }, true),
    // browser("firefox", { ...devices["Desktop Firefox"] }),
    // browser("webkit", { ...devices["Desktop Safari"] }),
    // browser("mobile-chrome", { ...devices["Pixel 9"] }),
    // browser("mobile-safari", { ...devices["iPhone 16"] }),
    // Branded browsers use the copy installed on the machine, so they are opt-in: BRANDED_BROWSERS=1
    // (install them with: npx playwright install chrome msedge)
    ...(process.env.BRANDED_BROWSERS
      ? [
          browser("google-chrome", { ...devices["Desktop Chrome"], channel: "chrome" }),
          browser("microsoft-edge", { ...devices["Desktop Edge"], channel: "msedge" }),
        ]
      : []),
  ],
  webServer: {
    command: "node app/server.mjs",
    url: BASE_URL,
    // Never reuse a running server when bugs are switched on: it would not have them
    reuseExistingServer: !process.env.CI && !process.env.BUGS,
    timeout: 120 * 1000,
  },
});
