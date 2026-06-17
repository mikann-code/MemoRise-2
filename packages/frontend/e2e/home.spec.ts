import { test, expect } from "@playwright/test";

// ホーム画面が表示されることを確認するサンプル E2E。
// 各機能 Issue では、この形を雛形に代表導線（ログイン→テスト→記録 等）を追加する。
test("ホーム画面が表示される", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "MemoRise v2" })
  ).toBeVisible();
});
