import { test, expect, type Page } from "@playwright/test";

/**
 * 公式単語帳の閲覧〜テストの代表導線を検証する E2E。
 * CI のフロントジョブはバックエンドを起動しないため、GraphQL をモックして
 * 「一覧 → 教材（親）で Part と進捗 → 章の一覧(list) → 単語テスト(test) → 結果」を検証する。
 */
const WORDS = [
  { id: "100", question: "improve", answer: "改善する", __typename: "Word" },
  { id: "101", question: "reason", answer: "理由", __typename: "Word" },
];

async function mockGraphql(page: Page) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    if (op === "Me") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            me: {
              id: "1",
              name: "テスト太郎",
              email: "taro@example.com",
              role: "user",
              streak: 0,
              wordsCount: 0,
              __typename: "User",
            },
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

    if (op === "PublicWordbook") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            publicWordbook: {
              id: "1",
              title: "TOEIC",
              label: "toeic",
              level: "中級",
              children: [
                {
                  id: "10",
                  title: "TOEIC 第1章",
                  part: "1",
                  wordsCount: 2,
                  __typename: "Wordbook",
                },
              ],
              __typename: "Wordbook",
            },
          },
        }),
      });
      return;
    }

    if (op === "PublicWordbookChapters") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            publicWordbook: {
              id: "1",
              title: "TOEIC",
              children: [
                {
                  id: "10",
                  title: "TOEIC 第1章",
                  part: "1",
                  description: "テスト用の章です。",
                  wordsCount: 2,
                  words: WORDS,
                  __typename: "Wordbook",
                },
              ],
              __typename: "Wordbook",
            },
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

test("一覧→教材で Part と進捗が見え、章の単語一覧へ遷移できる（代表導線）", async ({
  page,
}) => {
  await mockGraphql(page);

  await page.goto("/basicWordList");
  await expect(
    page.getByRole("heading", { name: "公式単語集" }),
  ).toBeVisible();

  // 本カード（教材）を開く
  await page.getByRole("link", { name: /TOEIC/ }).click();
  await expect(page).toHaveURL(/\/basicWord\/1$/);

  // 教材トップ：Part と進捗が見える
  await expect(page.getByText("第1章")).toBeVisible();
  await expect(page.getByText("進捗：0 / 1 Part 完了")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "今すぐはじめる" }),
  ).toBeVisible();

  // 章の単語一覧（list）へ
  await page.getByRole("link", { name: "第1章の単語一覧" }).click();
  await expect(page).toHaveURL(/\/basicWord\/1\/10\/list$/);
  await expect(page.getByText("登録単語数：2")).toBeVisible();
  await expect(page.getByText("improve")).toBeVisible();
  await expect(page.getByText("reason")).toBeVisible();
});

test("単語テストを最後まで解くと結果画面が表示される", async ({ page }) => {
  await mockGraphql(page);

  await page.goto("/basicWord/1/10/test");

  await expect(
    page.getByRole("heading", { name: "単語テスト" }),
  ).toBeVisible();
  await expect(page.getByText("1 / 2 問目")).toBeVisible();

  // 「答えを見る」まで正誤ボタンは押せない（"不正解" と部分一致しないよう exact 指定）
  const correct = page.getByRole("button", { name: "正解", exact: true });
  await expect(correct).toBeDisabled();

  // 1 問目
  await page.getByRole("button", { name: "答えを見る" }).click();
  await expect(correct).toBeEnabled();
  await correct.click();

  // 2 問目
  await expect(page.getByText("2 / 2 問目")).toBeVisible();
  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "正解", exact: true }).click();

  // 結果画面
  await expect(
    page.getByRole("heading", { name: "テスト結果" }),
  ).toBeVisible();
  await expect(page.getByText("正答率 100%")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "一覧に戻る" }),
  ).toBeVisible();
});

test("未知ラベルの公式単語帳は「未分類」に出て一覧から消えない", async ({
  page,
}) => {
  // FE/BE のラベル定義がズレても教材が消えないためのフォールバック節を検証する。
  await page.route("**/graphql", async (route) => {
    const op = (route.request().postDataJSON() as { operationName?: string })
      ?.operationName;
    if (op === "Me") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            me: {
              id: "1",
              name: "テスト太郎",
              email: "taro@example.com",
              role: "user",
              streak: 0,
              wordsCount: 0,
              __typename: "User",
            },
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
                id: "9",
                title: "謎の単語帳",
                label: "unknown_label",
                level: null,
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

  await page.goto("/basicWordList");
  await expect(page.getByRole("heading", { name: "未分類" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /謎の単語帳/ }),
  ).toBeVisible();
});
