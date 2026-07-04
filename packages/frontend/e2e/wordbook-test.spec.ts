import { test, expect, type Page } from "@playwright/test";

/**
 * 自作単語帳の単語テストの代表導線を検証する E2E。
 * 出題（答え伏せ・判定不可）→ 答えを見る → 正誤判定 → 正答率の反映 → 結果画面 → 一覧に戻る、
 * をひとつなぎで通す。GraphQL はモックし、ログイン状態は Me で作る。
 * 出題順はシャッフルされるため、画面に表示された単語から出題順を特定して進める。
 */

const WORDS = [
  { id: "1", question: "apple", answer: "りんご", __typename: "Word" },
  { id: "2", question: "book", answer: "ほん", __typename: "Word" },
] as const;

async function mockGraphql(page: Page) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    const json = (data: unknown) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data }),
      });

    if (op === "Me") {
      await json({
        me: {
          id: "1",
          name: "テスト太郎",
          email: "taro@example.com",
          role: "user",
          streak: 0,
          wordsCount: 2,
          __typename: "User",
        },
      });
      return;
    }

    if (op === "MyWordbook") {
      await json({
        myWordbook: {
          id: "10",
          title: "テスト英単語帳",
          description: "毎日の英単語",
          label: null,
          wordsCount: WORDS.length,
          words: [...WORDS],
          __typename: "Wordbook",
        },
      });
      return;
    }

    await json({ me: null });
  });
}

test("単語テストを最後まで実行して結果画面を確認できる（代表導線）", async ({
  page,
}) => {
  await mockGraphql(page);

  await page.goto("/wordbooks/10/test");
  await expect(page.getByRole("heading", { name: "単語テスト" })).toBeVisible();
  await expect(page.getByText("1 / 2 問目")).toBeVisible();
  await expect(page.getByText("正答率 0%")).toBeVisible();

  // 出題順はシャッフルされるため、1 問目に表示された単語からもう一方（2 問目）を特定する
  const firstQuestion = (
    await page.getByText(/^(apple|book)$/).textContent()
  )?.trim();
  const first = WORDS.find((w) => w.question === firstQuestion)!;
  const second = WORDS.find((w) => w.question !== firstQuestion)!;
  expect(first).toBeTruthy();

  // 答えを見るまでは答えが表示されず、正誤判定もできない
  await expect(page.getByText(first.answer, { exact: true })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "正解", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "不正解", exact: true })).toBeDisabled();

  // 答えを見る → 答えが表示され、判定できるようになる
  await page.getByRole("button", { name: "答えを見る" }).click();
  await expect(page.getByText(first.answer, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "答えを表示中" })).toBeDisabled();
  await page.getByRole("button", { name: "正解", exact: true }).click();

  // 2 問目：正答率が反映され、答えは再び伏せられる
  await expect(page.getByText("2 / 2 問目")).toBeVisible();
  await expect(page.getByText("正答率 100%")).toBeVisible();
  await expect(
    page.getByText(second.answer, { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "不正解", exact: true }).click();

  // 結果画面：最終正答率と、間違えた単語が答え付きの WordCard で並ぶ
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect(page.getByText("2 / 2 問目")).toBeVisible();
  await expect(page.getByText("正答率 50%")).toBeVisible();
  await expect(page.getByText(second.question, { exact: true })).toBeVisible();
  await expect(page.getByText(second.answer, { exact: true })).toBeVisible();

  // 一覧に戻る
  await page.getByRole("link", { name: "一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
});
