import { test, expect, type Page } from "@playwright/test";

/**
 * ホーム画面の表示とログインガードを検証する E2E。
 * ホームは (auth) グループ配下（ログイン必須）のため、GraphQL をモックして
 * 「認証済みなら 4 セクションが並ぶ」「未認証なら /login へリダイレクト」を検証する。
 * 今日の一問（todayWord）・週 streak（studyRecordsWeek）の API 接続も併せて確認する。
 */

// ローカル日付を YYYY-MM-DD で返す（studyRecordsWeek のモック日付を今週に合わせる）。
function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function mockGraphql(
  page: Page,
  { authenticated }: { authenticated: boolean },
) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    const op = body?.operationName;

    if (op === "Me") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            me: authenticated
              ? {
                  id: "1",
                  name: "テスト太郎",
                  email: "taro@example.com",
                  role: "user",
                  streak: 0,
                  wordsCount: 0,
                  __typename: "User",
                }
              : null,
          },
        }),
      });
      return;
    }

    if (op === "TodayWord") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            todayWord: {
              id: "1",
              question: "serendipity",
              answer: "予期せぬ発見",
              __typename: "Word",
            },
          },
        }),
      });
      return;
    }

    if (op === "StudyRecordsWeek") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            studyRecordsWeek: [
              {
                id: "1",
                studyDate: isoToday(),
                studyCount: 5,
                __typename: "StudyRecord",
              },
            ],
          },
        }),
      });
      return;
    }

    if (op === "TaggedWords") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: { taggedWords: [] } }),
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

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { me: null } }),
    });
  });
}

test("ホーム画面が表示される（4 セクション）", async ({ page }) => {
  await mockGraphql(page, { authenticated: true });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今日の一問" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "公式単語帳" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "オリジナル単語帳" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "継続記録" })).toBeVisible();

  // 今日の一問：todayWord API の単語が表示される（フォールバックではなく API 由来）。
  await expect(page.getByText("serendipity")).toBeVisible();
  await expect(page.getByText("予期せぬ発見")).toBeVisible();

  // 週 streak：studyRecordsWeek で学習済みの日（今日）のドットが点灯する。
  await expect(
    page.locator('[data-testid="LocalFireDepartmentIcon"]').first(),
  ).toBeVisible();
});

test("未認証で / にアクセスすると /login へリダイレクトされる（ガード）", async ({
  page,
}) => {
  await mockGraphql(page, { authenticated: false });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
