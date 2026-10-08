import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", // Updated test location
  timeout: 30000,
  use: {
    headless: true,
    browserName: "chromium",
  },
}); 