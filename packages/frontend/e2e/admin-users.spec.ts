import { test, expect, type Page } from "@playwright/test";

/**
 * 管理者のユーザー一覧（検索・並び替え・ページャ）の E2E。
 * CI のフロントジョブはバックエンドを起動しないため GraphQL をモックする。
 * モックは adminUsers の variables（keyword / page / perPage / sortBy / sortOrder）を
 * 実データセットに適用して nodes / totalCount を返し、サーバー挙動を再現する。
 */
const ADMIN = {
  id: "1",
  name: "管理者太郎",
  email: "admin@example.com",
  role: "admin",
  __typename: "User",
};

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  wordsCount: number;
  streak: number;
  createdAt: string;
};

// 25 人分の固定データ。createdAt は id が大きいほど新しい（＝既定の降順で id 降順）。
const USERS: MockUser[] = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  return {
    id: String(n),
    name: n === 3 ? "Alice" : `ユーザー${n}`,
    email: n === 3 ? "alice@example.com" : `user${n}@example.com`,
    role: "user",
    wordsCount: n, // n が大きいほど単語数が多い
    streak: 0,
    createdAt: `2026-01-${String(n).padStart(2, "0")}T00:00:00Z`,
    __typename: "User",
  } as MockUser;
});

async function mockAdminGraphql(page: Page) {
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: Record<string, unknown>;
    };
    const op = body?.operationName;
    const json = (data: unknown) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ data }) });

    if (op === "AdminMe") return json({ adminMe: ADMIN });

    if (op === "AdminUsers") {
      const v = body.variables ?? {};
      const keyword = ((v.keyword as string) ?? "").toLowerCase();
      const page1 = (v.page as number) ?? 1;
      const perPage = (v.perPage as number) ?? 20;
      const sortBy = (v.sortBy as string) ?? "CREATED_AT";
      const sortOrder = (v.sortOrder as string) ?? "DESC";

      let rows = USERS.filter(
        (u) =>
          !keyword ||
          u.name.toLowerCase().includes(keyword) ||
          u.email.toLowerCase().includes(keyword),
      );
      const col = sortBy === "WORDS_COUNT" ? "wordsCount" : "createdAt";
      rows = [...rows].sort((a, b) => {
        const av = a[col as keyof MockUser];
        const bv = b[col as keyof MockUser];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortOrder === "ASC" ? cmp : -cmp;
      });
      const totalCount = rows.length;
      const nodes = rows.slice((page1 - 1) * perPage, (page1 - 1) * perPage + perPage);
      return json({ adminUsers: { nodes, totalCount, __typename: "AdminUsersResult" } });
    }

    return json({});
  });
}

test("管理者がユーザー一覧を検索・並び替え・ページ送りできる", async ({ page }) => {
  await mockAdminGraphql(page);
  await page.goto("/admin/users");

  await expect(page.getByRole("heading", { name: "ユーザー一覧" })).toBeVisible();

  // 既定：登録日の降順（id 25 が先頭）。総件数 25、1 ページ 20 件。
  await expect(page.getByText("1–20 / 25")).toBeVisible();
  await expect(page.getByRole("cell", { name: "ユーザー25" })).toBeVisible();

  // 2 ページ目へ（残り 5 件）。
  await page.getByRole("button", { name: "Go to next page" }).click();
  await expect(page.getByText("21–25 / 25")).toBeVisible();

  // キーワード検索：Alice に絞り込む（デバウンス待ち込みで自動再取得）。
  await page.getByPlaceholder("名前・メールで検索").fill("alice");
  await expect(page.getByText("1–1 / 1")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Alice", exact: true })).toBeVisible();

  // 検索クリアして単語数の昇順に並び替え（見出しクリックで昇順トグル）。
  await page.getByPlaceholder("名前・メールで検索").fill("");
  await expect(page.getByText("1–20 / 25")).toBeVisible();
  await page.getByRole("button", { name: "単語数" }).click(); // WORDS_COUNT DESC
  await page.getByRole("button", { name: "単語数" }).click(); // → ASC
  // 単語数昇順の先頭は wordsCount=1 の「ユーザー1」。
  await expect(page.getByRole("cell", { name: "ユーザー1", exact: true })).toBeVisible();
});
