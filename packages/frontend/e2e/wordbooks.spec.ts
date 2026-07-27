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
  // 単語一覧を開いた記録（OpenWordbook）の呼び出し履歴。開いた単語帳の id を順に積む。
  const openedWordbookIds: string[] = [];

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

    // 単語一覧を開いた記録。最終閲覧日時（lastStudied）を今の時刻で埋め、
    // 一覧に戻ったときに「未学習」から相対時刻表示へ変わることを確認できるようにする。
    if (op === "OpenWordbook") {
      const wordbook = wordbooks.find((w) => w.id === vars.id) ?? null;
      if (wordbook) {
        openedWordbookIds.push(wordbook.id);
        wordbook.lastStudied = new Date().toISOString();
      }
      await json({
        openWordbook: {
          success: wordbook != null,
          errors: [],
          wordbook: wordbook
            ? {
                id: wordbook.id,
                lastStudied: wordbook.lastStudied,
                __typename: "Wordbook",
              }
            : null,
          __typename: "OpenWordbookPayload",
        },
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

    // 削除は常に失敗を返し、握りつぶさず通知が出ることを検証する。
    if (op === "DeleteWord") {
      await json({
        deleteWord: {
          success: false,
          errors: [],
          word: null,
          __typename: "DeleteWordPayload",
        },
      });
      return;
    }

    await json({ me: null });
  });

  return { openedWordbookIds };
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

test("単語の削除に失敗したら通知が出る（握りつぶさない）", async ({ page }) => {
  await mockGraphql(page);

  // 単語帳を作成し、単語を 1 件登録してから削除を試みる
  await page.goto("/wordbooks");
  await page.getByRole("link", { name: "＋ 新しい単語帳" }).click();
  await page.getByLabel("単語帳タイトル").fill("削除テスト帳");
  await page.getByRole("button", { name: "作成", exact: true }).click();

  await page.getByRole("link", { name: /削除テスト帳/ }).click();
  await page.getByLabel("単語", { exact: true }).fill("apple");
  await page.getByLabel("意味", { exact: true }).fill("りんご");
  await page.getByRole("button", { name: "単語を登録" }).click();
  await expect(page.getByText("apple")).toBeVisible();

  // 削除アイコン → 確認モーダルで OK。サーバーは失敗を返す。
  await page.getByRole("button", { name: "削除" }).click();
  await page.getByRole("button", { name: "OK" }).click();

  // 握りつぶさず失敗通知が出て、単語はカードに残る
  await expect(page.getByText("削除に失敗しました")).toBeVisible();
  await expect(page.getByText("apple")).toBeVisible();
});

test("単語一覧を開くと最終閲覧日時が記録され、一覧の「未学習」表示が消える", async ({
  page,
}) => {
  const { openedWordbookIds } = await mockGraphql(page);

  // 単語帳を作成した直後は一度も開いていないので「未学習」
  await page.goto("/wordbooks");
  await page.getByRole("link", { name: "＋ 新しい単語帳" }).click();
  await page.getByLabel("単語帳タイトル").fill("閲覧記録テスト帳");
  await page.getByRole("button", { name: "作成", exact: true }).click();

  await expect(page).toHaveURL(/\/wordbooks$/);
  await expect(page.getByText("未学習")).toBeVisible();
  expect(openedWordbookIds).toEqual([]);

  // 単語一覧を開くと、テストを実施していなくてもその時点で記録される
  await page.getByRole("link", { name: /閲覧記録テスト帳/ }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
  await expect(
    page.getByRole("heading", { name: "閲覧記録テスト帳" }),
  ).toBeVisible();
  await expect.poll(() => openedWordbookIds).toEqual(["10"]);

  // 一覧に戻ると相対時刻に変わり、「未学習」は出なくなる
  await page.goto("/wordbooks");
  await expect(page.getByText("閲覧記録テスト帳")).toBeVisible();
  await expect(page.getByText("未学習")).not.toBeVisible();

  // 同じ一覧を開き直しても 1 ページ表示につき 1 回だけ送る（Strict Mode の二重実行を防ぐ）
  await page.getByRole("link", { name: /閲覧記録テスト帳/ }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
  await expect.poll(() => openedWordbookIds).toEqual(["10", "10"]);
});
