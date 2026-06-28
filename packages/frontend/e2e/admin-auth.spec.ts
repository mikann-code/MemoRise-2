import { test, expect, type Page } from "@playwright/test";

/**
 * 管理者認証の代表導線を検証する E2E。
 * CI のフロントジョブはバックエンドを起動しないため、GraphQL をモックして
 * 「管理者ログイン → /admin 遷移」と「未認証で /admin → /admin-login リダイレクト（ガード）」を検証する。
 */
async function mockAdminGraphql(page: Page, { authenticated }: { authenticated: boolean }) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    if (op === "AdminLogin") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            adminLogin: {
              user: {
                id: "1",
                name: "管理者太郎",
                email: "admin@example.com",
                role: "admin",
                __typename: "User",
              },
              __typename: "AdminLoginPayload",
            },
          },
        }),
      });
      return;
    }

    // adminMe は authenticated のときだけ管理者を返す（未認証ならガードが redirect する）。
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          adminMe: authenticated
            ? {
                id: "1",
                name: "管理者太郎",
                email: "admin@example.com",
                role: "admin",
                __typename: "User",
              }
            : null,
        },
      }),
    });
  });
}

test("管理者ログインすると管理者ダッシュボードに遷移する（代表導線）", async ({ page }) => {
  await mockAdminGraphql(page, { authenticated: true });

  let adminLoginSent = false;
  page.on("request", (req) => {
    if (req.url().includes("/graphql") && req.postData()?.includes('"AdminLogin"')) {
      adminLoginSent = true;
    }
  });

  await page.goto("/admin-login");
  await expect(
    page.getByRole("heading", { name: "管理者ログイン" }),
  ).toBeVisible();

  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(
    page.getByRole("heading", { name: "管理者ダッシュボード" }),
  ).toBeVisible();
  expect(adminLoginSent).toBe(true);
});

test("未認証で /admin にアクセスすると /admin-login へリダイレクトされる（ガード）", async ({ page }) => {
  await mockAdminGraphql(page, { authenticated: false });

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "管理者ログイン" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin-login$/);
});
