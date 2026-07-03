import { test, expect, type Page } from "@playwright/test";

/**
 * ホーム画面の表示とログインガードを検証する E2E。
 * ホームは (auth) グループ配下（ログイン必須）のため、GraphQL をモックして
 * 「認証済みなら 4 セクションが並ぶ」「未認証なら /login へリダイレクト」を検証する。
 */
async function mockGraphql(
  page: Page,
  { authenticated }: { authenticated: boolean },
) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    if (op === "Me") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            me: authenticated
              ? {
                  id: "1",
                  name: "テスト太郎",
                  email: "taro@example.com",
                  role: "user",
                  streak: 0,
                  wordsCount: 0,
                  __typename: "User",
                }
              : null,
          },
        }),
      });
      return;
    }

    if (op === "PublicWordbooks") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            publicWordbooks: [
              {
                id: "1",
                title: "TOEIC",
                label: "toeic",
                level: "中級",
                __typename: "Wordbook",
              },
            ],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { me: null } }),
    });
  });
}

test("ホーム画面が表示される（4 セクション）", async ({ page }) => {
  await mockGraphql(page, { authenticated: true });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今日の一問" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "公式単語帳" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "オリジナル単語帳" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "継続記録" })).toBeVisible();
});

test("未認証で / にアクセスすると /login へリダイレクトされる（ガード）", async ({
  page,
}) => {
  await mockGraphql(page, { authenticated: false });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
