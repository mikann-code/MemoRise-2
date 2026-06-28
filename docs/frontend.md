# フロントエンド設計（MemoRise v2）

> v1（Next.js 15 App Router / React 18 / TanStack React Query / Tailwind + CSS Modules / 独自 fetch）の画面・ルーティング・コンポーネント設計を抽出し、v2 スタック（Next.js 16 App Router / React 19 / **Apollo Client 4 + GraphQL** / **MUI 7** / TipTap）前提で再構成したもの。画面構成と権限分離の思想は v1 を踏襲する。

## 1. ルーティング設計（Route Group による権限分離）

App Router の Route Group `(xxx)` で、URL に出さずに権限ごとに空間を分ける。グループごとに `layout.tsx` で認証ガードを集約する。

| グループ | 認証 | 画面 |
| --- | --- | --- |
| `(public)` | 不要 | `/login`、`/signup` |
| `(semi-auth)` | 一部開放 | `/basicWordList`（公式単語帳一覧）、`/basicWord/[parentId]`、`/basicWord/[parentId]/[childrenId]/list`、`/basicWord/[parentId]/[childrenId]/test`、`/my-page`、`/my-page/edit` |
| `(auth)` | 必須 | `/wordbooks`、`/wordbooks/new`、`/wordbooks/[id]/list`、`/wordbooks/[id]/edit`、`/wordbooks/[id]/test`、`/wordbooks/review`、`/study-records` |
| `(admin-user)` | 管理者 | `/admin-login`、`/admin`、`/admin/users`、`/admin/wordbooks`、`/admin/wordbooks/[parentId]`、`/admin/wordbooks/[parentId]/edit`、`/admin/wordbooks/[parentId]/[childrenId]` |
| ルート | 自己完結 | `/`（ホーム） |

- 親子単語帳は `/[parentId]/[childrenId]` の二段ルーティングで「TOEIC > Day 1」のような体系を表現。
- `AdminLayout` は管理者情報（`adminMe`）を見て、未ログイン or role 不一致なら `redirect("/admin-login")`。Next.js の `redirect()` をコンポーネント内で使う流儀。

## 2. レイヤー分離

v1 の責務分離を v2 でも維持する（変更単位を小さく保つ）。

| レイヤー | v1 | v2 |
| --- | --- | --- |
| データ取得ロジック | `lib/*.ts`（fetch + エラー処理） | `src/graphql/` の `graphql()` ドキュメント + Codegen 型（client-preset）+ 薄いフックラッパー |
| キャッシュ / 状態 | `hooks/use*.tsx`（React Query） | Apollo Client（`useQuery` / `useMutation`） |
| UI 描画 | `components/` | `components/`（MUI ベース） |
| ルーティング / 画面 | `app/` | `app/` |

- v1 では「API が変わったら lib だけ」「キャッシュ戦略が変わったら hooks だけ」という設計だった。v2 では Codegen により**スキーマ変更が型に自動反映**され、この分離がさらに強化される（運用手順は [graphql.md](./graphql.md)）。

## 3. コンポーネント構成（役割で 4 分割）

| 階層 | 役割 | v1 の例 |
| --- | --- | --- |
| `common/` | 汎用パーツ | Button / ButtonSecondary / FloatingInput / JudgeButtons / LoadingSpinner / SectionTitle / WordCard / 各種 Card |
| `layout/` | レイアウト | Header / Footer / FormLayout / WordbookListLayout |
| `feature/` | 機能ロジック内包 | Test / Calendar |
| `home/` | トップ専用 | DailyWord / BasicWord / CraftWord |

設計指針（v2 でも踏襲、MUI に載せ替え）：
- **Composition**：`FormLayout` は header / description / form を ReactNode で受け、ログイン・新規登録で使い回す。
- **WordCard の共通利用**：`opened` / `review` / `deletable` / `onTagToggle` の組み合わせで「テスト中（答え伏せ）／結果（開く）／一覧（削除可）」を切り替え、1 コンポーネントを場面ごとに再利用。
- **状態の hoisting**：葉コンポーネント（WordCard）は状態を持たず props で受け取り、テスト全体の状態は `Test` に集約。
- **JudgeButtons の disabled 連動**：「答えを見る」まで正誤判定不可（UI 制約でチートを防止）。
- v2 では Button / FloatingInput 等は **MUI のコンポーネント（Button / TextField 等）に置き換え**、自作 CSS は MUI の theme / sx に移行する。

## 4. 主要画面とデータ

| 画面 | 内容 | 取得データ |
| --- | --- | --- |
| ホーム `/` | 今日の一問 / 公式単語 / 自作導線 / 週 streak の 4 セクション合成 | todayWord, publicWordbooks, taggedWords（バッジ）, studyRecordsWeek |
| 公式単語帳 | 親一覧 → 子（章）→ 単語一覧 / テスト | publicWordbooks, publicWordbook.children, publicWordbook.words |
| 自作単語帳 | 一覧 / 作成 / 編集 / 単語一覧 / テスト / 復習 | wordbooks, words, taggedWords |
| 学習記録 `/study-records` | カレンダー表示 | studyRecords(year, month) |
| マイページ `/my-page` | streak / 登録単語数 / プロフィール編集 | me, totalWords |
| 管理 `/admin/*` | 公式単語帳 CRUD / CSV / ユーザー一覧 / 統計 | adminWordbooks, adminUsers, adminStats |

- 各ホームセクションは**自己完結ウィジェット**（内部でローディング・エラー・フォールバックを処理）。構成変更はセクションの並べ替えだけで済む。
- `DailyWord` は取得失敗時に内蔵 `fallbackWords` からランダム 1 件を表示し、初回ロードの空白を防ぐ。

## 5. テスト機能のフロー（v1 のロジックを維持）

1. `useWords`（v2: GraphQL クエリ）の結果をシャッフルしてから `Test` に渡す。シャッフルは `startTransition` で低優先度化し UI をブロックしない。
2. 「答えを見る」→ 正誤判定。誤答時は `addTaggedWord` を `await`（v2: `mutateAsync` 相当の Apollo mutation の await）してから次へ進め、確実にタグ登録。
3. テスト終了（`currentIndex >= total`）を `useEffect` で検知し、`createStudyRecord`（履歴）と `completeWordbookProgress`（進捗）を発火。
4. **冪等性**：`hasPostedRef = useRef(false)` で Strict Mode の二重実行・二重送信を防止。

## 6. 認証・通信（v1 → v2）

- v1：一般 = `user_token` / 管理者 = `admin_token` の別 Cookie。共通 fetch を `authFetch` / `adminAuthFetch` に分離。401 を `UNAUTHORIZED` / `ADMIN_UNAUTHORIZED` で区別。
- v2：認証は **DB セッション方式**（JWT から変更）。HttpLink を `credentials: "include"` にして、サーバー発行のセッション Cookie（`_memorise_session`）を毎リクエスト送る。**トークンの手動付与・`Authorization` ヘッダは無し**。
- **Apollo Client のインスタンスを一般用・管理者用で分離**（`makeUserApolloClient` / `makeAdminApolloClient`、`InMemoryCache` も別インスタンス）し、キャッシュ空間を分離して汚染を防ぐ（v1 の `["me"]` / `["adminMe"]` キー分離に相当）。
- 認証ガードは **Cookie の有無ではなく `me` クエリの結果で判定**する（セッション Cookie はクロスオリジンで Next サーバーから読めないため）。`AuthProvider` が `me` を引き、未認証なら `/login` へリダイレクトする。
- GraphQL エンドポイント URL は `NEXT_PUBLIC_GRAPHQL_URL`（既定 `http://localhost:3100/graphql`）で環境切替。

## 7. キャッシュ戦略（v1 React Query → v2 Apollo）

| データ性質 | v1（React Query） | v2（Apollo） |
| --- | --- | --- |
| 頻繁に変わるリスト（wordbooks, taggedWords） | staleTime 未設定で常に最新 | `fetchPolicy: cache-and-network` |
| 集計系（studyRecords, totalWords） | staleTime 60s | `cache-first`（適度に保持） |
| me 系 | retry: false | エラーポリシーで未認証時に即エラー表示 |
| Mutation 後 | invalidateQueries で再取得 | `refetchQueries` / キャッシュ更新 |

- ログアウト時はキャッシュをクリア（v1 `removeQueries(["me"])` → v2 `client.clearStore()`）。

## 8. その他の UI / UX 指針（踏襲）

- 未ログイン・通信失敗時のフォールバック（リッチな空状態、「ログイン / 新規登録」への導線）。
- 週初めを月曜に補正：`(jsDay - 1 + 7) % 7`。
- メタデータ（title / description）と多言語フォント（Noto Sans JP 等）を `RootLayout` で設定。
- 入力欄は `autoComplete="off"` をデフォルトに（テスト中の意図しない補完を防止）。
- v2 では単語帳の説明など長文入力に **TipTap** を導入し、リッチテキスト編集を可能にする。

## 9. v1 → v2 移行で注意する点

- React Query 由来の `enabled` / `setQueryData` / `invalidateQueries` は、Apollo の `skip` / `cache.writeQuery` / `refetchQueries` に対応づける。
- 自作 UI（CSS Modules / Tailwind）から MUI への載せ替えは、まず汎用パーツ（Button / Input / Card）から着手し、画面側の構造は維持する。
- GraphQL Codegen は導入済み（`postinstall` / `predev` / `prebuild` + CI で自動生成）。スキーマとフロント型の乖離をビルド時に検出する。運用手順は [graphql.md](./graphql.md)。
