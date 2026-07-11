import { defineConfig, devices } from "@playwright/test";

const port = process.env.SIMADEP_E2E_PORT ?? "3004";
const baseURL = process.env.SIMADEP_E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  outputDir: "test-results/playwright",
  webServer: process.env.SIMADEP_E2E_BASE_URL
    ? undefined
    : {
        command: `set "APP_URL=${baseURL}" && set "BETTER_AUTH_URL=${baseURL}" && npm.cmd run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
