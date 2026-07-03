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
  // ローカルは Docker + Next dev サーバーと併走するため並列数を抑える
  // （コア数既定の 8 並列だとブラウザが詰まり一斉タイムアウトする）。CI は既定値のまま。
  workers: process.env.CI ? undefined : 2,
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
