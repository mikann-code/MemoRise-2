import { test, expect, type Page } from "@playwright/test";

/**
 * 自作単語帳の代表導線を検証する E2E。
 * 一覧 → 新規作成 → 一覧に反映 → 単語一覧 → 単語登録、をひとつなぎで通す。
 * GraphQL はモックし、作成・追加をクロージャ内の状態に反映させて画面遷移後の再取得に応える。
 */

type MockWord = {
  id: string;
  question: string;
  answer: string;
  __typename: "Word";
};

type MockWordbook = {
  id: string;
  title: string;
  description: string;
  label: string | null;
  wordsCount: number;
  lastStudied: string | null;
  words: MockWord[];
  __typename: "Wordbook";
};

async function mockGraphql(page: Page) {
  const wordbooks: MockWordbook[] = [];
  let nextWordId = 1;

  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: Record<string, string>;
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
          name: "テスト太郎",
          email: "taro@example.com",
          role: "user",
          streak: 0,
          wordsCount: 0,
          __typename: "User",
        },
      });
      return;
    }

    if (op === "TaggedWords") {
      await json({ taggedWords: [] });
      return;
    }

    if (op === "MyWordbooks") {
      await json({
        myWordbooks: wordbooks.map(({ words: _words, ...rest }) => rest),
      });
      return;
    }

    if (op === "CreateWordbook") {
      const wordbook: MockWordbook = {
        id: "10",
        title: vars.title ?? "",
        description: vars.description ?? "",
        label: vars.label || null,
        wordsCount: 0,
        lastStudied: null,
        words: [],
        __typename: "Wordbook",
      };
      wordbooks.push(wordbook);
      const { words: _words, ...rest } = wordbook;
      await json({
        createWordbook: {
          success: true,
          errors: [],
          wordbook: rest,
          __typename: "CreateWordbookPayload",
        },
      });
      return;
    }

    if (op === "MyWordbook") {
      const wordbook = wordbooks.find((w) => w.id === vars.id) ?? null;
      await json({
        myWordbook: wordbook
          ? { ...wordbook, wordsCount: wordbook.words.length }
          : null,
      });
      return;
    }

    if (op === "CreateWord") {
      const wordbook = wordbooks.find((w) => w.id === vars.wordbookId);
      const word: MockWord = {
        id: String(nextWordId++),
        question: vars.question ?? "",
        answer: vars.answer ?? "",
        __typename: "Word",
      };
      wordbook?.words.push(word);
      await json({
        createWord: {
          success: true,
          errors: [],
          word,
          __typename: "CreateWordPayload",
        },
      });
      return;
    }

    await json({ me: null });
  });
}

test("単語帳を作成して単語を登録できる（代表導線）", async ({ page }) => {
  await mockGraphql(page);

  // 一覧（空）→ 空状態メッセージを確認して新規作成へ
  await page.goto("/wordbooks");
  await expect(page.getByRole("heading", { name: "単語帳一覧" })).toBeVisible();
  await expect(
    page.getByText("単語帳がありません。「 新しい単語帳 」から作成してください。"),
  ).toBeVisible();
  await page.getByRole("link", { name: "＋ 新しい単語帳" }).click();

  // 作成フォーム
  await expect(
    page.getByRole("heading", { name: "単語帳を作成" }),
  ).toBeVisible();
  await page.getByLabel("単語帳タイトル").fill("テスト英単語帳");
  await page.getByLabel("説明（任意）").fill("毎日の英単語");
  await page.getByLabel("ラベル（例: 英語 / IT / TOEIC）").fill("英語");
  await page.getByRole("button", { name: "作成", exact: true }).click();

  // 一覧に作成した単語帳が反映される
  await expect(page).toHaveURL(/\/wordbooks$/);
  await expect(page.getByText("テスト英単語帳")).toBeVisible();
  await expect(page.getByText("毎日の英単語")).toBeVisible();
  await expect(page.getByText("0 words")).toBeVisible();
  await expect(page.getByText("未学習")).toBeVisible();
  await expect(page.getByText("単語帳がありません。")).not.toBeVisible();

  // 単語一覧へ → 単語を登録
  await page.getByRole("link", { name: /テスト英単語帳/ }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
  await expect(
    page.getByRole("heading", { name: "テスト英単語帳" }),
  ).toBeVisible();

  await page.getByLabel("単語", { exact: true }).fill("apple");
  await page.getByLabel("意味", { exact: true }).fill("りんご");
  await page.getByRole("button", { name: "単語を登録" }).click();

  // 追加した単語がカードで表示され、登録単語数も増える
  await expect(page.getByText("apple")).toBeVisible();
  await expect(page.getByText("りんご")).toBeVisible();
  await expect(page.getByText("登録単語数：1")).toBeVisible();
});
