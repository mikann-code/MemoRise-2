import { test, expect, type Page } from "@playwright/test";

/**
 * 学習記録の保存と復習タグの代表導線を検証する E2E（#10 + 要件変更）。
 * 単語テストで誤答 → 結果画面の「間違えた単語を復習リストに登録」（confirm あり）でまとめて登録 →
 * 終了時に学習記録が 1 回だけ保存される → /wordbooks/review の復習単語一覧 →
 * 「今すぐはじめる」で復習専用テスト（/wordbooks/review/test）→ 結果から一覧へ戻る、をひとつなぎで通す。
 * 単語一覧のタグ付け・外しの confirm は別テストで検証する。
 * GraphQL はモックし、タグの登録・記録の保存はクロージャ内の状態に反映させる。
 */

type MockWord = {
  id: string;
  question: string;
  answer: string;
  __typename: "Word";
};

const WORDS: MockWord[] = [
  { id: "1", question: "apple", answer: "りんご", __typename: "Word" },
  { id: "2", question: "book", answer: "ほん", __typename: "Word" },
];

type StudyRecordCall = {
  kind: string;
  totalCount: number;
  correctCount: number;
  wordbookId?: string | null;
};

async function mockGraphql(page: Page, initialTaggedWords: MockWord[] = []) {
  // 復習タグ（新しい順）と、各 mutation の呼び出し履歴
  const taggedWords: MockWord[] = [...initialTaggedWords];
  const studyRecordCalls: StudyRecordCall[] = [];
  const addTaggedWordCalls: string[] = [];
  const removeTaggedWordCalls: string[] = [];

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
          wordsCount: WORDS.length,
          __typename: "User",
        },
      });
      return;
    }

    if (op === "MyWordbooks") {
      await json({
        myWordbooks: [
          {
            id: "10",
            title: "テスト英単語帳",
            description: "毎日の英単語",
            label: null,
            wordsCount: WORDS.length,
            lastStudied: null,
            __typename: "Wordbook",
          },
        ],
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

    if (op === "TaggedWords") {
      await json({ taggedWords: [...taggedWords] });
      return;
    }

    if (op === "AddTaggedWord") {
      addTaggedWordCalls.push(String(vars.wordId));
      const word = WORDS.find((w) => w.id === String(vars.wordId))!;
      if (!taggedWords.some((w) => w.id === word.id)) {
        taggedWords.unshift(word);
      }
      await json({
        addTaggedWord: {
          success: true,
          errors: [],
          word,
          __typename: "AddTaggedWordPayload",
        },
      });
      return;
    }

    if (op === "RemoveTaggedWord") {
      removeTaggedWordCalls.push(String(vars.wordId));
      const index = taggedWords.findIndex((w) => w.id === String(vars.wordId));
      if (index !== -1) taggedWords.splice(index, 1);
      await json({
        removeTaggedWord: {
          success: true,
          errors: [],
          __typename: "RemoveTaggedWordPayload",
        },
      });
      return;
    }

    if (op === "CreateStudyRecord") {
      studyRecordCalls.push({
        kind: String(vars.kind),
        totalCount: Number(vars.totalCount),
        correctCount: Number(vars.correctCount),
        wordbookId: vars.wordbookId == null ? null : String(vars.wordbookId),
      });
      await json({
        createStudyRecord: {
          success: true,
          errors: [],
          studyRecord: {
            id: String(studyRecordCalls.length),
            studyDate: "2026-07-05",
            studyCount: studyRecordCalls.reduce((n, c) => n + c.totalCount, 0),
            __typename: "StudyRecord",
          },
          __typename: "CreateStudyRecordPayload",
        },
      });
      return;
    }

    // 単語一覧を開いた記録。結果画面から一覧へ戻る導線で呼ばれる（検証は wordbooks.spec.ts）。
    if (op === "OpenWordbook") {
      await json({
        openWordbook: {
          success: true,
          errors: [],
          wordbook: {
            id: "10",
            lastStudied: "2026-07-25T12:00:00Z",
            __typename: "Wordbook",
          },
          __typename: "OpenWordbookPayload",
        },
      });
      return;
    }

    await json({ me: null });
  });

  return {
    taggedWords,
    studyRecordCalls,
    addTaggedWordCalls,
    removeTaggedWordCalls,
  };
}

test("誤答を結果画面から復習リストへ一括登録し、復習単語一覧を経由して復習テストを実施できる（代表導線）", async ({
  page,
}) => {
  const { studyRecordCalls, addTaggedWordCalls, removeTaggedWordCalls } =
    await mockGraphql(page);

  // --- 単語テスト：1 問目は正解、2 問目は不正解にする ---
  await page.goto("/wordbooks/10/test");
  await expect(page.getByRole("heading", { name: "単語テスト" })).toBeVisible();

  // 出題順はシャッフルされるため、1 問目に表示された単語からもう一方（2 問目）を特定する
  const firstQuestion = (
    await page.getByText(/^(apple|book)$/).textContent()
  )?.trim();
  const wrongWord = WORDS.find((w) => w.question !== firstQuestion)!;

  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "正解", exact: true }).click();

  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "不正解", exact: true }).click();

  // 結果画面：誤答した単語が表示される。誤答時点では復習タグは自動登録されない
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect(page.getByText("正答率 50%")).toBeVisible();
  await expect(
    page.getByText(wrongWord.question, { exact: true }),
  ).toBeVisible();
  expect(addTaggedWordCalls).toHaveLength(0);

  // 学習記録は 1 回だけ・単語帳付きで保存される（冪等）
  await expect
    .poll(() => studyRecordCalls.length, { message: "学習記録の保存回数" })
    .toBe(1);
  expect(studyRecordCalls[0]).toEqual({
    kind: "WORDBOOK",
    totalCount: 2,
    correctCount: 1,
    wordbookId: "10",
  });

  // --- 一括登録：confirm でキャンセルすると登録されない ---
  const registerButton = page.getByRole("button", {
    name: "復習リストに登録",
  });
  await registerButton.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("間違えた単語 1 件を復習リストに登録しますか？"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(dialog).not.toBeVisible();
  expect(addTaggedWordCalls).toHaveLength(0);

  // --- 一括登録：OK で登録され、登録済みになるとボタンは消える ---
  await registerButton.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "OK" })
    .click();
  await expect
    .poll(() => addTaggedWordCalls.length, { message: "タグ登録の呼び出し回数" })
    .toBe(1);
  expect(addTaggedWordCalls[0]).toBe(wrongWord.id);
  await expect(page.getByText("復習リストに登録しました")).toBeVisible();
  await expect(registerButton).not.toBeVisible();

  // --- 一覧のバッジに実数（1 件）が反映され、復習単語一覧へ遷移できる ---
  await page.getByRole("link", { name: "一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
  await page.goto("/wordbooks");
  const reviewBadge = page.getByRole("link", { name: /復習単語 \( 1 \)/ });
  await expect(reviewBadge).toBeVisible();
  await reviewBadge.click();

  // --- 復習単語一覧：登録した単語が並び、「今すぐはじめる」でテストへ（自作単語帳と同じ導線） ---
  await expect(page).toHaveURL(/\/wordbooks\/review$/);
  await expect(page.getByRole("heading", { name: "復習単語" })).toBeVisible();
  await expect(page.getByText("登録単語数：1語")).toBeVisible();
  await expect(
    page.getByText(wrongWord.question, { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "今すぐはじめる" }).click();

  // --- 復習専用テスト：登録した単語だけが出題される ---
  await expect(page).toHaveURL(/\/wordbooks\/review\/test$/);
  await expect(page.getByRole("heading", { name: "復習テスト" })).toBeVisible();
  await expect(page.getByText("1 / 1 問目")).toBeVisible();
  await expect(
    page.getByText(wrongWord.question, { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "正解", exact: true }).click();

  // 復習テストの結果画面と、単語帳なしでの記録保存（2 回目）
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect(page.getByText("正答率 100%")).toBeVisible();
  await expect
    .poll(() => studyRecordCalls.length, { message: "学習記録の保存回数" })
    .toBe(2);
  expect(studyRecordCalls[1]).toEqual({
    kind: "REVIEW",
    totalCount: 1,
    correctCount: 1,
    wordbookId: null,
  });

  // --- 一括解除：キャンセルすると外れない ---
  const removeButton = page.getByRole("button", { name: "覚えた単語を外す" });
  await expect(removeButton).toBeVisible();
  await removeButton.click();
  const removeDialog = page.getByRole("alertdialog");
  await expect(
    removeDialog.getByText("正解した単語 1 件を復習リストから外しますか？"),
  ).toBeVisible();
  await removeDialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(removeDialog).not.toBeVisible();
  expect(removeTaggedWordCalls).toHaveLength(0);

  // --- 一括解除：OK で正解した単語だけ外れ、外し終わるとボタンは消える ---
  await removeButton.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "OK" })
    .click();
  await expect
    .poll(
      () => removeTaggedWordCalls.length,
      { message: "タグ解除の呼び出し回数" },
    )
    .toBe(1);
  expect(removeTaggedWordCalls[0]).toBe(wrongWord.id);
  await expect(page.getByText("復習リストから外しました")).toBeVisible();
  await expect(removeButton).not.toBeVisible();

  // 復習テストの結果からは復習単語一覧へ戻る。解除した分だけ件数が減っている
  await page.getByRole("link", { name: "一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/wordbooks\/review$/);
  await expect(page.getByText("登録単語数：0語")).toBeVisible();
});

test("復習テストの結果画面には「復習リストに登録」を出さない（一括操作は解除だけ）", async ({
  page,
}) => {
  // 復習タグ付きの状態から復習専用テストに入る（登録は公式・自作のテストの役割）
  const { addTaggedWordCalls, removeTaggedWordCalls } = await mockGraphql(
    page,
    WORDS,
  );

  await page.goto("/wordbooks/review/test");
  await expect(page.getByRole("heading", { name: "復習テスト" })).toBeVisible();

  // 1 問目：テスト中にタグを外してから不正解にする（「未タグの誤答」を作る）
  await page.getByRole("button", { name: "復習タグ" }).click();
  await expect
    .poll(() => removeTaggedWordCalls.length, { message: "タグ解除の呼び出し" })
    .toBe(1);
  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "不正解", exact: true }).click();

  // 2 問目も不正解（正解 0 件にして「覚えた単語を外す」も出ない状態にする）
  await page.getByRole("button", { name: "答えを見る" }).click();
  await page.getByRole("button", { name: "不正解", exact: true }).click();

  // 結果画面：未タグの誤答があっても登録ボタンは出さない（戻り導線だけ）
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "復習リストに登録" }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "覚えた単語を外す" }),
  ).not.toBeVisible();
  await expect(page.getByRole("link", { name: "一覧に戻る" })).toBeVisible();
  expect(addTaggedWordCalls).toHaveLength(0);
});

test("単語一覧のタグ付け・外しは confirm を挟んでから反映される", async ({
  page,
}) => {
  const { addTaggedWordCalls, removeTaggedWordCalls } = await mockGraphql(page);

  await page.goto("/wordbooks/10/list");
  await expect(
    page.getByRole("heading", { name: "テスト英単語帳" }),
  ).toBeVisible();

  // --- タグを付ける：キャンセルすると登録されない ---
  const firstTagButton = page.getByRole("button", { name: "復習タグ" }).first();
  await firstTagButton.click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByText("この単語を復習リストに登録しますか？"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(dialog).not.toBeVisible();
  expect(addTaggedWordCalls).toHaveLength(0);

  // --- タグを付ける：OK で登録される ---
  await firstTagButton.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "OK" })
    .click();
  await expect
    .poll(() => addTaggedWordCalls.length, { message: "タグ登録の呼び出し回数" })
    .toBe(1);
  expect(addTaggedWordCalls[0]).toBe(WORDS[0].id);

  // --- タグを外す：外し側も confirm を挟む ---
  await firstTagButton.click();
  await expect(
    page
      .getByRole("alertdialog")
      .getByText("この単語を復習リストの登録から外しますか？"),
  ).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "OK" })
    .click();
  await expect
    .poll(
      () => removeTaggedWordCalls.length,
      { message: "タグ解除の呼び出し回数" },
    )
    .toBe(1);
  expect(removeTaggedWordCalls[0]).toBe(WORDS[0].id);
});
