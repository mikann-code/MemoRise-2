import { test, expect } from "@playwright/test";

/**
 * セキュリティヘッダー（next.config.ts の headers()）の E2E。
 * ページのレスポンスに、iframe 埋め込みの禁止などのヘッダーが付くことを確認する。
 * 認証もデータ取得も伴わないため GraphQL のモックは張らない。
 */

const EXPECTED_HEADERS = {
  "content-security-policy": "frame-ancestors 'none'",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

for (const path of ["/login", "/this-page-does-not-exist"]) {
  test(`${path} のレスポンスにセキュリティヘッダーが付く`, async ({ page }) => {
    const response = await page.goto(path);
    const headers = response?.headers() ?? {};

    for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
      expect(headers[name], name).toBe(value);
    }
  });
}
