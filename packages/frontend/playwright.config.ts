import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 設定。
 * webServer で Next.js dev を自動起動し、http://localhost:3200 を叩く。
 * ローカルでは既存の起動済みサーバーを再利用、CI では新規起動する。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
