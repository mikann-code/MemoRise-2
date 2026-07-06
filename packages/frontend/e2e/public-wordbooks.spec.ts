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
  // publicWordbooks 配下も ReviewTagProvider を mount するため TaggedWords / AddTaggedWord が飛ぶ。
  const taggedWords: { id: string; question: string; answer: string }[] = [];
  const addTaggedWordCalls: string[] = [];
  // テスト完了時の学習記録（CreateStudyRecord）の呼び出し履歴。
  const createStudyRecordCalls: Record<string, string | number | null>[] = [];
  // 章の完了（CompleteWordbookProgress）の呼び出し履歴。
  const completeWordbookProgressCalls: string[] = [];

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

    if (op === "WordbookProgresses") {
      // 先頭章（id: 10）はサーバーが遅延作成済み＝解放済みで返す。
      await json({
        wordbookProgresses: [
          {
            id: "p10",
            wordbookId: "10",
            completed: false,
            __typename: "WordbookProgress",
          },
        ],
      });
      return;
    }

    if (op === "CompleteWordbookProgress") {
      completeWordbookProgressCalls.push(String(vars.wordbookId));
      await json({
        completeWordbookProgress: {
          success: true,
          errors: [],
          progresses: [
            {
              id: "p10",
              wordbookId: "10",
              completed: true,
              __typename: "WordbookProgress",
            },
          ],
          __typename: "CompleteWordbookProgressPayload",
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

  return {
    taggedWords,
    addTaggedWordCalls,
    createStudyRecordCalls,
    completeWordbookProgressCalls,
  };
}

test("一覧→教材で Part と進捗が見え、章の単語一覧へ遷移できる（代表導線）", async ({
  page,
}) => {
  await mockGraphql(page);

  await page.goto("/publicWordbooks");
  await expect(
    page.getByRole("heading", { name: "公式単語集" }),
  ).toBeVisible();

  // 本カード（教材）を開く
  await page.getByRole("link", { name: /TOEIC/ }).click();
  await expect(page).toHaveURL(/\/publicWordbooks\/1$/);

  // 教材トップ：Part と進捗が見える
  await expect(page.getByText("第1章")).toBeVisible();
  await expect(page.getByText("進捗：0 / 1 Part 完了")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "今すぐはじめる" }),
  ).toBeVisible();

  // 章の単語一覧（list）へ
  await page.getByRole("link", { name: "第1章の単語一覧" }).click();
  await expect(page).toHaveURL(/\/publicWordbooks\/1\/10\/list$/);
  await expect(page.getByText("登録単語数：2")).toBeVisible();
  await expect(page.getByText("improve")).toBeVisible();
  await expect(page.getByText("reason")).toBeVisible();
});

test("単語テストを最後まで解くと結果画面が表示され、学習記録が保存される", async ({
  page,
}) => {
  const { createStudyRecordCalls, completeWordbookProgressCalls } =
    await mockGraphql(page);

  await page.goto("/publicWordbooks/1/10/test");

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

  // 章の完了（次 Part 解放）もバックエンドへ 1 回だけ届く。
  await expect
    .poll(() => completeWordbookProgressCalls.length, {
      message: "CompleteWordbookProgress の呼び出し回数",
    })
    .toBe(1);
  expect(completeWordbookProgressCalls[0]).toBe("10");
});

test("誤答は結果画面から復習リストへ一括登録できる（confirm あり・バックエンド保存）", async ({
  page,
}) => {
  const { addTaggedWordCalls } = await mockGraphql(page);

  await page.goto("/publicWordbooks/1/10/test");
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

test("章のテストを完了すると次の Part が解放される（API 接続・2 章）", async ({
  page,
}) => {
  // 進捗はバックエンド保存。CompleteWordbookProgress で章10 を完了し章11 を解放する状態遷移を
  // ステートフルなモックで再現する（page.route はページ遷移をまたいでも保持される）。
  const progresses = [{ id: "p10", wordbookId: "10", completed: false }];
  const completeCalls: string[] = [];
  const children = [
    { id: "10", title: "TOEIC 第1章", wordsCount: 2 },
    { id: "11", title: "TOEIC 第2章", wordsCount: 2 },
  ];

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
    if (op === "PublicWordbook") {
      await json({
        publicWordbook: {
          id: "1",
          title: "TOEIC",
          label: "toeic",
          level: "中級",
          children: children.map((c) => ({ ...c, __typename: "Wordbook" })),
          __typename: "Wordbook",
        },
      });
      return;
    }
    if (op === "WordbookProgresses") {
      await json({
        wordbookProgresses: progresses.map((p) => ({
          ...p,
          __typename: "WordbookProgress",
        })),
      });
      return;
    }
    if (op === "PublicWordbookChapters") {
      await json({
        publicWordbook: {
          id: "1",
          title: "TOEIC",
          children: children.map((c) => ({
            ...c,
            description: "テスト用の章です。",
            words: WORDS,
            __typename: "Wordbook",
          })),
          __typename: "Wordbook",
        },
      });
      return;
    }
    if (op === "CreateStudyRecord") {
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
    if (op === "CompleteWordbookProgress") {
      completeCalls.push(String(vars.wordbookId));
      const target = progresses.find(
        (p) => p.wordbookId === String(vars.wordbookId),
      );
      if (target) target.completed = true;
      if (!progresses.some((p) => p.wordbookId === "11")) {
        progresses.push({ id: "p11", wordbookId: "11", completed: false });
      }
      await json({
        completeWordbookProgress: {
          success: true,
          errors: [],
          progresses: progresses.map((p) => ({
            ...p,
            __typename: "WordbookProgress",
          })),
          __typename: "CompleteWordbookProgressPayload",
        },
      });
      return;
    }
    await json({ me: null });
  });

  // 教材トップ：先頭章だけ解放、2 章目はロック表示。
  await page.goto("/publicWordbooks/1");
  await expect(page.getByText("進捗：0 / 2 Part 完了")).toBeVisible();
  await expect(page.getByText("第1章")).toBeVisible();
  await expect(
    page.getByText("この Part はまだ解放されていません"),
  ).toBeVisible();

  // 1 章目のテストを最後まで解く（完了で章解放 API が飛ぶ）。
  await page.getByRole("link", { name: "今すぐはじめる" }).click();
  await expect(page).toHaveURL(/\/publicWordbooks\/1\/10\/test$/);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "答えを見る" }).click();
    await page.getByRole("button", { name: "正解", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect
    .poll(() => completeCalls, { message: "CompleteWordbookProgress の呼び出し" })
    .toEqual(["10"]);

  // 教材トップに戻ると 2 章目が解放されている（ロック表示が消え、単語一覧リンクが出る）。
  await page.goto("/publicWordbooks/1");
  await expect(page.getByText("進捗：1 / 2 Part 完了")).toBeVisible();
  await expect(
    page.getByText("この Part はまだ解放されていません"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "第2章の単語一覧" }),
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

  await page.goto("/publicWordbooks");
  await expect(page.getByRole("heading", { name: "未分類" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /謎の単語帳/ }),
  ).toBeVisible();
});
