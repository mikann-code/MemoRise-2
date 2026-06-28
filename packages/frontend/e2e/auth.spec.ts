import { test, expect, type Page } from "@playwright/test";

/**
 * 認証の代表導線を検証する E2E。
 * CI のフロントジョブはバックエンドを起動しないため、GraphQL をモックして
 * 「フォーム入力 → Mutation 送信 → 成功時のホーム遷移」を検証する。
 */
async function mockGraphql(page: Page) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    if (op === "SignUp" || op === "Login") {
      const key = op === "SignUp" ? "signUp" : "login";
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            [key]: {
              user: {
                id: "1",
                name: "テスト太郎",
                email: "taro@example.com",
                role: "user",
                streak: 0,
                wordsCount: 0,
                __typename: "User",
              },
              __typename: op === "SignUp" ? "SignUpPayload" : "LoginPayload",
            },
          },
        }),
      });
      return;
    }

    // me などその他は未認証扱いで返す。
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { me: null } }),
    });
  });
}

test("新規登録するとホーム画面に遷移する（代表導線）", async ({ page }) => {
  await mockGraphql(page);

  let signUpSent = false;
  page.on("request", (req) => {
    if (req.url().includes("/graphql") && req.postData()?.includes('"SignUp"')) {
      signUpSent = true;
    }
  });

  await page.goto("/signup");
  await page.getByLabel("名前").fill("テスト太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  // 「パスワード」と「パスワード（確認）」が部分一致しないよう exact 指定。
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード（確認）").fill("password123");
  await page.getByRole("button", { name: "新規登録" }).click();

  await expect(
    page.getByRole("heading", { name: "MemoRise v2" }),
  ).toBeVisible();
  expect(signUpSent).toBe(true);
});

test("ログイン画面から新規登録画面へ遷移できる", async ({ page }) => {
  await mockGraphql(page);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();

  await page.getByRole("link", { name: "新規登録" }).click();
  await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
});
