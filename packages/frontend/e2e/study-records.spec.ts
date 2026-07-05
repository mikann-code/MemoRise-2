import { test, expect, type Page } from "@playwright/test";

/**
 * 学習記録画面（/study-records）の代表導線を検証する E2E。
 * GraphQL はモックし、「カレンダー表示 → 日付選択で詳細 → 月送り」と
 * streak / 週ストリーク・ダッシュボード（直近一覧）の表示を確認する。
 * カレンダーは常に当月から始まるため、テストデータは実行日基準で組み立てる。
 */

// ローカル日付を "YYYY-MM-DD" に整形（ISO 変換のタイムゾーンずれを避ける）。
function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const todayStr = formatDate(today);

// studyCount はカレンダーの日付数字（1〜31）と衝突しない値にして、
// バッジのテキストを exact 一致で特定できるようにする。
const studyRecord = {
  id: "1",
  studyDate: todayStr,
  studyCount: 99,
  studyDetails: [
    {
      id: "10",
      title: "TOEIC part1",
      rate: 80,
      totalCount: 10,
      correctCount: 8,
      __typename: "StudyDetail",
    },
  ],
  __typename: "StudyRecord",
};

async function mockGraphql(page: Page) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { year?: number; month?: number };
    };
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
              streak: 3,
              wordsCount: 0,
              __typename: "User",
            },
          },
        }),
      });
      return;
    }

    if (op === "StudyRecords") {
      // 当月だけ記録あり。月送り後（別の年月）は空を返す。
      const isCurrentMonth =
        body.variables?.year === year && body.variables?.month === month;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: { studyRecords: isCurrentMonth ? [studyRecord] : [] },
        }),
      });
      return;
    }

    if (op === "StudyRecordsWeek") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { studyRecordsWeek: [studyRecord] } }),
      });
      return;
    }

    if (op === "StudyRecordsRecent") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { studyRecordsRecent: [studyRecord] } }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { me: null } }),
    });
  });
}

test("カレンダーと streak が表示され、日付選択で詳細が出る", async ({
  page,
}) => {
  await mockGraphql(page);
  await page.goto("/study-records");

  // 見出し + streak（me.streak = 3 日）
  await expect(page.getByRole("heading", { name: "学習記録" })).toBeVisible();
  await expect(page.getByText("連続学習3日")).toBeVisible();

  // 当月カレンダーに学習数バッジ（studyCount）が出る
  await expect(
    page.getByRole("heading", { name: `${year}年${month}月` }),
  ).toBeVisible();
  await expect(page.getByText("99", { exact: true })).toBeVisible();

  // 学習した日を選ぶと study_details（タイトル / 正答数 / 正答率）が出る
  await page
    .getByRole("button", { name: `${month}月${today.getDate()}日` })
    .click();
  await expect(page.getByText("TOEIC part1")).toBeVisible();
  await expect(page.getByText("8/10")).toBeVisible();
  await expect(page.getByText("80%")).toBeVisible();
});

test("月送りで前月・翌月に切り替わる", async ({ page }) => {
  await mockGraphql(page);
  await page.goto("/study-records");

  await expect(
    page.getByRole("heading", { name: `${year}年${month}月` }),
  ).toBeVisible();

  // 前の月へ（記録なしの月はバッジも消える）
  const prev = new Date(year, month - 1 - 1, 1);
  await page.getByRole("button", { name: "前の月" }).click();
  await expect(
    page.getByRole("heading", {
      name: `${prev.getFullYear()}年${prev.getMonth() + 1}月`,
    }),
  ).toBeVisible();
  await expect(page.getByText("99", { exact: true })).not.toBeVisible();

  // 次の月へ 2 回で翌月まで戻る
  await page.getByRole("button", { name: "次の月" }).click();
  await page.getByRole("button", { name: "次の月" }).click();
  const next = new Date(year, month - 1 + 1, 1);
  await expect(
    page.getByRole("heading", {
      name: `${next.getFullYear()}年${next.getMonth() + 1}月`,
    }),
  ).toBeVisible();
});

test("ダッシュボードタブで直近の学習記録一覧が出る", async ({ page }) => {
  await mockGraphql(page);
  await page.goto("/study-records");

  await page.getByRole("button", { name: "ダッシュボード" }).click();
  await expect(
    page.getByText("最近の学習記録一覧（最新30件）"),
  ).toBeVisible();
  await expect(page.getByText("TOEIC part1")).toBeVisible();
  await expect(page.getByText("words")).toBeVisible();
});
