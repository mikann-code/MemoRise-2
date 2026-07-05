import { test, expect, type Page } from "@playwright/test";

/**
 * 学習記録の保存と復習タグの代表導線を検証する E2E（#10）。
 * 単語テストで誤答 → 復習タグが自動登録され、終了時に学習記録が 1 回だけ保存される →
 * /wordbooks/review の復習専用テストで誤答単語だけを再学習 →
 * 一覧の復習件数バッジに実数が出る、をひとつなぎで通す。
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

async function mockGraphql(page: Page) {
  // 復習タグ（新しい順）と、保存された学習記録の呼び出し履歴
  const taggedWords: MockWord[] = [];
  const studyRecordCalls: StudyRecordCall[] = [];

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

    await json({ me: null });
  });

  return { taggedWords, studyRecordCalls };
}

test("誤答が復習タグに登録され、記録が 1 回だけ保存され、復習専用テストを実施できる（代表導線）", async ({
  page,
}) => {
  const { studyRecordCalls } = await mockGraphql(page);

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

  // 結果画面：誤答した単語が復習タグ付き（オレンジ枠）で表示される
  await expect(page.getByRole("heading", { name: "テスト結果" })).toBeVisible();
  await expect(page.getByText("正答率 50%")).toBeVisible();
  await expect(
    page.getByText(wrongWord.question, { exact: true }),
  ).toBeVisible();

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

  // --- 一覧のバッジに実数（1 件）が反映され、復習専用テストへ遷移できる ---
  await page.getByRole("link", { name: "一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/wordbooks\/10\/list$/);
  await page.goto("/wordbooks");
  const reviewBadge = page.getByRole("link", { name: /復習単語 \( 1 \)/ });
  await expect(reviewBadge).toBeVisible();
  await reviewBadge.click();

  // --- 復習専用テスト：誤答した単語だけが出題される ---
  await expect(page).toHaveURL(/\/wordbooks\/review$/);
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

  // 復習テストの結果からは単語帳一覧へ戻る
  await page.getByRole("link", { name: "一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/wordbooks$/);
});
