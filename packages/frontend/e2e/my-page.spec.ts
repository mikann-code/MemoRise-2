import { test, expect, type Page } from "@playwright/test";

/**
 * マイページの代表導線を検証する E2E。
 * CI のフロントジョブはバックエンドを起動しないため GraphQL をモックし、
 * 「マイページ表示（streak・登録単語数）→ プロフィール編集 → 名前がカード/ヘッダーに反映」を検証する。
 * Me / UpdateProfile はステートフルにして、更新後の名前が refetch で反映されることを見る。
 */
async function mockGraphql(page: Page) {
  let userName = "テスト太郎";
  const updateProfileCalls: Record<string, string | number | null>[] = [];

  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: Record<string, string | number | null>;
    };
    const op = body?.operationName;
    const vars = body?.variables ?? {};
    const json = (data: unknown) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data }),
      });

    if (op === "Me") {
      await json({
        me: {
          id: "1",
          name: userName,
          email: "taro@example.com",
          role: "user",
          streak: 7,
          wordsCount: 12,
          createdAt: "2026-01-01T00:00:00Z",
          __typename: "User",
        },
      });
      return;
    }
    if (op === "UpdateProfile") {
      updateProfileCalls.push(vars);
      userName = String(vars.name);
      await json({
        updateProfile: {
          success: true,
          errors: [],
          user: {
            id: "1",
            name: userName,
            email: "taro@example.com",
            role: "user",
            streak: 7,
            wordsCount: 12,
            createdAt: "2026-01-01T00:00:00Z",
            __typename: "User",
          },
          __typename: "UpdateProfilePayload",
        },
      });
      return;
    }
    await json({ me: null });
  });

  return { updateProfileCalls };
}

test("マイページに名前・登録単語数・連続記録・メールが表示される", async ({
  page,
}) => {
  await mockGraphql(page);

  await page.goto("/my-page");

  await expect(page.getByRole("heading", { name: "マイページ" })).toBeVisible();
  // 数値・名前はメイン領域に限定して引く（ヘッダーの「〜さん」や dev のエラーオーバーレイ等、
  // メイン外の同一テキストとの strict-mode 衝突を避ける）。
  const main = page.getByRole("main");
  // 名前（カードは「テスト太郎」・ヘッダーは「テスト太郎 さん」なので exact でカードを指す）
  await expect(main.getByText("テスト太郎", { exact: true })).toBeVisible();
  await expect(main.getByText("登録単語")).toBeVisible();
  await expect(main.getByText("連続記録")).toBeVisible();
  await expect(main.getByText("12")).toBeVisible(); // 登録単語数（me.wordsCount）
  await expect(main.getByText("7")).toBeVisible(); // 連続記録（streak）
  await expect(main.getByText("taro@example.com")).toBeVisible();
});

test("プロフィール編集で名前を変更するとカードとヘッダーに反映される", async ({
  page,
}) => {
  const { updateProfileCalls } = await mockGraphql(page);

  await page.goto("/my-page/edit");
  await expect(
    page.getByRole("heading", { name: "プロフィール編集" }),
  ).toBeVisible();

  const nameInput = page.locator("#name");
  await expect(nameInput).toHaveValue("テスト太郎");
  await nameInput.fill("新しい名前");
  await page.getByRole("button", { name: "保存", exact: true }).click();

  // 更新通知 → マイページへ戻り、名前が即時反映される
  await expect(page.getByText("プロフィールを更新しました")).toBeVisible();
  await expect(page).toHaveURL(/\/my-page$/);
  await expect(
    page.getByRole("main").getByText("新しい名前", { exact: true }),
  ).toBeVisible();
  // ヘッダーも currentUser の refetch で追随する
  await expect(page.getByText("新しい名前 さん")).toBeVisible();

  expect(updateProfileCalls).toHaveLength(1);
  expect(updateProfileCalls[0]).toMatchObject({ name: "新しい名前" });
});
