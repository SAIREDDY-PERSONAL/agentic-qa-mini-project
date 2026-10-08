import { defineConfig } from "@playwright/test";

// PORT and BUGS are passed through to app/server.mjs, e.g. PORT=8093 BUGS=upload
const PORT = Number(process.env.PORT ?? 8080);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  // tests/judge-demo holds deliberately weak tests that only run in the judge demo (npm run judge:demo)
  grepInvert: process.env.JUDGE_DEMO ? undefined : /@judge-demo/,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    browserName: "chromium",
    // Screenshot at the end of every test, shown in the HTML report (and used by the judge)
    screenshot: "on",
    // Full trace for failed tests, for debugging and the healer agent
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node app/server.mjs",
    url: BASE_URL,
    // Never reuse a running server when bugs are switched on: it would not have them
    reuseExistingServer: !process.env.CI && !process.env.BUGS,
    timeout: 120 * 1000,
  },
});
