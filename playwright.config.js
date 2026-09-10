// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "android",
      use: {
        ...devices["Pixel 7"],
        defaultBrowserType: "chromium",
      },
    },
    {
      name: "iphone",
      use: {
        ...devices["iPhone 14 Pro"],
        defaultBrowserType: "webkit",
      },
    },
    {
      name: "ipad",
      use: {
        ...devices["iPad Pro 11"],
        defaultBrowserType: "webkit",
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        defaultBrowserType: "chromium",
      },
    },
  ],
  webServer: {
    command: "node scripts/serve-dist.js",
    port: 4173,
    reuseExistingServer: true,
  },
});
