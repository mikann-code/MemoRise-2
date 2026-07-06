import { test, expect, type Page } from "@playwright/test";

/**
 * 管理者の公式単語帳運用の代表導線を検証する E2E。
 * CI のフロントジョブはバックエンドを起動しないため GraphQL をモックし、
 * 「管理者ログイン状態 → 教材作成 → 一覧に反映 → 自動作成された第1章で単語登録」を通しで確認する。
 * 教材（親）は章の入れ物で単語を直接持たないため、教材詳細に単語フォームが無いことも見る。
 * バックエンドは教材の作成時に既定の章「第1章」を自動作成するため、モックも同じ挙動を再現する。
 * モックは operationName で分岐し、作成した教材・章・単語をクロージャで保持して後続クエリに反映する。
 */
const ADMIN = {
  id: "1",
  name: "管理者太郎",
  email: "admin@example.com",
  role: "admin",
  __typename: "User",
};

const PARENT_ID = "10";
const CHAPTER_ID = "11";

async function mockAdminGraphql(page: Page) {
  // 作成した教材・章・単語をクロージャで保持し、後続の一覧/詳細クエリに反映する。
  const wordbooks: Array<Record<string, unknown>> = [];
  const chapters: Array<Record<string, unknown>> = [];
  const words: Array<Record<string, unknown>> = [];

  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      operationName?: string;
      variables?: Record<string, unknown>;
    };
    const op = body?.operationName;
    const json = (data: unknown) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ data }) });

    switch (op) {
      case "AdminMe":
        return json({ adminMe: ADMIN });

      case "AdminWordbooks":
        return json({ adminWordbooks: wordbooks });

      case "CreateAdminWordbook": {
        // parentId 付きは章の作成、無しは教材の作成（教材は第1章を自動作成する BE 挙動を再現）。
        const isChapter = body.variables?.parentId != null;
        const wb = {
          id: isChapter ? String(chapters.length + Number(CHAPTER_ID)) : PARENT_ID,
          title: body.variables?.title,
          description: "",
          label: null,
          level: null,
          orderIndex: null,
          wordsCount: 0,
          parentId: isChapter ? PARENT_ID : null,
          __typename: "Wordbook",
        };
        if (isChapter) {
          chapters.push(wb);
        } else {
          wordbooks.push(wb);
          chapters.push({
            id: CHAPTER_ID,
            title: "第1章",
            description: "",
            label: null,
            level: null,
            orderIndex: 1,
            wordsCount: 0,
            parentId: PARENT_ID,
            __typename: "Wordbook",
          });
        }
        return json({
          createAdminWordbook: {
            success: true,
            errors: [],
            wordbook: { id: wb.id, title: wb.title, parentId: wb.parentId, __typename: "Wordbook" },
            __typename: "CreateAdminWordbookPayload",
          },
        });
      }

      case "AdminWordbook": {
        // 教材（親）と章を id で出し分ける。単語は章にのみ載る。
        const chapter = chapters.find((c) => c.id === body.variables?.id);
        if (chapter) {
          return json({
            adminWordbook: {
              ...chapter,
              wordsCount: words.length,
              children: [],
              words,
            },
          });
        }
        return json({
          adminWordbook: {
            id: PARENT_ID,
            title: "TOEIC 基礎",
            description: "",
            label: null,
            level: null,
            orderIndex: null,
            wordsCount: 0,
            parentId: null,
            children: chapters,
            words: [],
            __typename: "Wordbook",
          },
        });
      }

      case "CreateAdminWord": {
        const word = {
          id: String(words.length + 1),
          question: body.variables?.question,
          answer: body.variables?.answer,
          __typename: "Word",
        };
        words.push(word);
        return json({
          createAdminWord: {
            success: true,
            errors: [],
            word,
            __typename: "CreateAdminWordPayload",
          },
        });
      }

      default:
        return json({});
    }
  });
}

test("管理者が教材を作成し、自動作成された第1章に単語を登録できる（代表導線）", async ({ page }) => {
  await mockAdminGraphql(page);

  // 教材を作成
  await page.goto("/admin/wordbooks/new");
  await expect(page.getByRole("heading", { name: "教材を作成" })).toBeVisible();
  await page.getByLabel("教材タイトル").fill("TOEIC 基礎");
  await page.getByRole("button", { name: "作成" }).click();

  // 一覧へ戻り、作成した教材が並ぶ
  await expect(page).toHaveURL(/\/admin\/wordbooks$/);
  await expect(page.getByRole("link", { name: /TOEIC 基礎/ })).toBeVisible();

  // 詳細へ進む。教材（親）は単語を直接持たないため単語フォームは出ない
  await page.getByRole("link", { name: /TOEIC 基礎/ }).click();
  await expect(page.getByRole("heading", { name: "TOEIC 基礎" })).toBeVisible();
  await expect(page.getByText("単語は章の中に登録します", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "単語を登録" })).toHaveCount(0);

  // 既定の章「第1章」が自動作成されている。手動でも章を追加できる
  await expect(page.getByRole("link", { name: /第1章/ })).toBeVisible();
  await page.getByLabel("章タイトル").fill("第2章");
  await page.getByRole("button", { name: "章を追加" }).click();
  await expect(page.getByRole("link", { name: /第2章/ })).toBeVisible();

  // 第1章の詳細へ進む
  await page.getByRole("link", { name: /第1章/ }).click();
  await expect(page.getByRole("heading", { name: "第1章" })).toBeVisible();

  // 章に単語を登録
  await page.getByLabel("単語").fill("apple");
  await page.getByLabel("意味").fill("りんご");
  await page.getByRole("button", { name: "単語を登録" }).click();

  // 登録した単語がカードに表示される
  await expect(page.getByText("apple")).toBeVisible();
  await expect(page.getByText("りんご")).toBeVisible();
});
