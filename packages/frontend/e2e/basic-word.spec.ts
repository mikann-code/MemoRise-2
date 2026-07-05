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
  // 復習タグ（バックエンド保存）の状態と、AddTaggedWord の呼び出し履歴。
  // basicWord 配下も ReviewTagProvider を mount するため TaggedWords / AddTaggedWord が飛ぶ。
  const taggedWords: { id: string; question: string; answer: string }[] = [];
  const addTaggedWordCalls: string[] = [];
  // テスト完了時の学習記録（CreateStudyRecord）の呼び出し履歴。
  const createStudyRecordCalls: Record<string, string | number | null>[] = [];

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

    if (op === "TaggedWords") {
      await json({
        taggedWords: taggedWords.map((w) => ({ ...w, __typename: "Word" })),
      });
      return;
    }

    if (op === "AddTaggedWord") {
      addTaggedWordCalls.push(String(vars.wordId));
      const word = WORDS.find((w) => w.id === String(vars.wordId));
      if (word && !taggedWords.some((w) => w.id === word.id)) {
        taggedWords.unshift({
          id: word.id,
          question: word.question,
          answer: word.answer,
        });
      }
      await json({
        addTaggedWord: {
          success: true,
          errors: [],
          word: word ?? null,
          __typename: "AddTaggedWordPayload",
        },
      });
      return;
    }

    if (op === "CreateStudyRecord") {
      createStudyRecordCalls.push(vars);
      await json({
        createStudyRecord: {
          success: true,
          errors: [],
          studyRecord: null,
          __typename: "CreateStudyRecordPayload",
        },
      });
      return;
    }

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

    await json({ me: null });
  });

  return { taggedWords, addTaggedWordCalls, createStudyRecordCalls };
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

test("単語テストを最後まで解くと結果画面が表示され、学習記録が保存される", async ({
  page,
}) => {
  const { createStudyRecordCalls } = await mockGraphql(page);

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

  // 公式単語テストの完了で学習記録が 1 回だけ保存される
  // （kind = WORDBOOK・章の単語帳 ID を wordbookId に渡す）。
  await expect
    .poll(() => createStudyRecordCalls.length, {
      message: "CreateStudyRecord の呼び出し回数",
    })
    .toBe(1);
  expect(createStudyRecordCalls[0]).toMatchObject({
    kind: "WORDBOOK",
    totalCount: 2,
    correctCount: 2,
    wordbookId: "10",
  });
});

test("誤答は結果画面から復習リストへ一括登録できる（confirm あり・バックエンド保存）", async ({
  page,
}) => {
  const { addTaggedWordCalls } = await mockGraphql(page);

  await page.goto("/basicWord/1/10/test");
  await expect(page.getByRole("heading", { name: "単語テスト" })).toBeVisible();

  // 2 問とも不正解にする（誤答時点では復習タグは自動登録されない）
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "答えを見る" }).click();
    await page.getByRole("button", { name: "不正解", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();

  // キャンセルでは登録されず、ボタンも残る
  const registerButton = page.getByRole("button", {
    name: "復習リストに登録",
  });
  await registerButton.click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByText("間違えた単語 2 件を復習リストに登録しますか？"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(registerButton).toBeVisible();
  expect(addTaggedWordCalls).toHaveLength(0);

  // OK で登録。公式単語帳の単語もバックエンド（AddTaggedWord）へ届く。
  // 登録済みになるとボタンごと消え、通知が出る
  await registerButton.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "OK" })
    .click();
  await expect(page.getByText("復習リストに登録しました")).toBeVisible();
  await expect(registerButton).not.toBeVisible();

  // 公式単語帳の 2 単語がバックエンドの復習タグへ登録された（id は WORDS のもの）
  await expect
    .poll(() => [...addTaggedWordCalls].sort(), {
      message: "AddTaggedWord の呼び出し",
    })
    .toEqual(["100", "101"]);
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
