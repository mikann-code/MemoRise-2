import { test, expect } from "@playwright/test";

/**
 * 404 ページ（app/not-found.tsx）の E2E。
 * 存在しない URL でアプリのテーマに沿った 404 が出て、ホームへ戻れることを確認する。
 * 認証もデータ取得も伴わないため GraphQL のモックは張らない。
 */

test("存在しない URL では 404 ページを表示し、ホームへ戻れる", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);

  await expect(
    page.getByRole("heading", { name: "ページが見つかりません" }),
  ).toBeVisible();

  // 戻り導線（ホーム / 単語帳一覧）が出ている
  await expect(page.getByRole("link", { name: "単語帳一覧へ" })).toBeVisible();
  await page.getByRole("link", { name: "ホームへ戻る" }).click();

  // ホームは要ログインなので、未ログインではログイン画面へ流れる（/ を離れられている）
  await expect(page).not.toHaveURL(/this-page-does-not-exist/);
});
