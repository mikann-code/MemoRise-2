# フロントエンド設計（MemoRise v2）

> v1（Next.js 15 App Router / React 18 / TanStack React Query / Tailwind + CSS Modules / 独自 fetch）の画面・ルーティング・コンポーネント設計を抽出し、v2 スタック（Next.js 16 App Router / React 19 / **Apollo Client 4 + GraphQL** / **MUI 7** / TipTap）前提で再構成したもの。画面構成と権限分離の思想は v1 を踏襲する。

## 1. ルーティング設計（Route Group による権限分離）

App Router の Route Group `(xxx)` で、URL に出さずに権限ごとに空間を分ける。グループごとに `layout.tsx` で認証ガードを集約する。

実装済みのグループと画面（設計時の `(semi-auth)` は `(auth)` に統合した）：

| グループ | 認証 | 画面（実装済み） |
| --- | --- | --- |
| `(public)` | 不要 | `/login`、`/signup` |
| `(auth)` | 必須 | `/`（ホーム）、`/publicWordbooks`、`/publicWordbooks/[parentId]`、`/publicWordbooks/[parentId]/[childrenId]/list`、`/publicWordbooks/[parentId]/[childrenId]/test`、`/wordbooks`、`/wordbooks/new`、`/wordbooks/[id]/list`、`/wordbooks/[id]/edit`、`/wordbooks/[id]/test`、`/wordbooks/review`（復習単語一覧）、`/wordbooks/review/test`（復習専用テスト）、`/study-records`（学習記録）、`/my-page`（マイページ）、`/my-page/edit`（プロフィール編集） |
| `(admin)` | 管理者 | `/admin-login`、`/admin` |

未実装（今後追加予定）：`/admin/users`、`/admin/wordbooks` 配下。

- 親子単語帳は `/[parentId]/[childrenId]` の二段ルーティングで「TOEIC > Day 1」のような体系を表現。
- `(auth)` は `AuthProvider`（`me` クエリ）でガードし、未認証は `/login` へリダイレクト。`(admin)` は `AdminAuthProvider`（`adminMe`）で同様にガードする。

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

| 階層 | 役割 | 現状の中身 |
| --- | --- | --- |
| `common/ui/` | 汎用パーツ | Button / ButtonSecondary / FloatingInput / JudgeButtons / LoadingSpinner / SectionTitle |
| `common/card/` | カード | WordCard / ErrorCard / DailyRecordCard（学習記録 1 日分） |
| `layout/` | レイアウト | Layout（共通シェル）/ Header / Footer / FormLayout / WordbookListLayout |
| `feature/` | Provider・機能ロジック | AuthProvider / AdminAuthProvider / SnackbarProvider / ReviewTagProvider / PublicWordbookTest / WordbookTest / StudyCalendar（学習カレンダー） |
| `home/` | トップ専用 | DailyWord / PublicWordbook / CraftWord / WeeklyStreakCard |

設計指針：
- **Composition**：`FormLayout` / `WordbookListLayout` は header / form / list 等を ReactNode で受ける Slot 型。幅・余白は `Layout` の main `Container` に一元化し、内側のレイアウトは `width: 100%` で並べるだけにする。
- **WordCard の共通利用**：`opened` / `review` / `deletable` / `onTagToggle` / `onEdit` / `showTag` の組み合わせで「テスト中（答え伏せ）／結果（開く）／一覧（編集・削除可）」を切り替え、1 コンポーネントを場面ごとに再利用。
  - q / a の 2 セル flex が基本。アイコン行は両セルの `py` で空けた上部の帯に絶対配置し、テキストと重ねない。
  - **単語テキストは省略しない**（ellipsis・1 行制限は禁止、折り返しで全文表示）。768px 以下はアイコン 3 個を「…」メニューに集約する。
  - `review` の単語はカード枠をオレンジ（`--color-primary`）で強調。
- **状態の hoisting**：葉コンポーネント（WordCard）は状態を持たず props で受け取り、テスト全体の状態は `PublicWordbookTest` に集約。
- **JudgeButtons の disabled 連動**：「答えを見る」まで正誤判定不可（UI 制約でチートを防止）。
- Button / FloatingInput 等は **MUI ベースの薄い自作ラッパー**として `common/ui/` に置き、見た目は theme / sx で v1 に寄せる。
- **復習タグはバックエンド保存**（#10）：`ReviewTagProvider`（wordbooks/layout.tsx と publicWordbooks/layout.tsx に mount）が
  `taggedWords` クエリを 1 箇所で引き、付け外し（mutation → refetch）と件数バッジを配下ページへ配る。
  公式単語帳の単語もバックエンドがタグ付けに対応済み（`base_tagged_word_mutation.rb`）なので、
  自作・公式のどちらの復習タグも同じ復習単語一覧（`/wordbooks/review`）に載る。
  ホームのバッジ（DailyWord）は Provider の外なので同じクエリを直接引く（Apollo キャッシュ共有）。
- **章の進捗（パート解放）はバックエンド保存**（#12）：publicWordbooks 配下の教材トップ（親）が
  `wordbookProgresses(wordbookId)` を引き、進捗レコードが存在する章＝解放済み・`completed`＝テスト完了で解放状態を描く。
  テスト完了時に `completeWordbookProgress` を発火して次章を解放する（`completedRef` で二重送信を防ぐ）。
  先行再現に使っていた `PublicWordbookSessionProvider`（クライアント一時状態）は廃止した。

## 4. 主要画面とデータ

| 画面 | 内容 | 取得データ |
| --- | --- | --- |
| ホーム `/` | 今日の一問 / 公式単語 / 自作導線 / 週 streak の 4 セクション合成 | todayWord, publicWordbooks, taggedWords（バッジ）, studyRecordsWeek |
| 公式単語帳 | 親一覧 → 子（章）→ 単語一覧 / テスト | publicWordbooks, publicWordbook.children, publicWordbook.words |
| 自作単語帳 | 一覧 / 作成 / 編集 / 単語一覧 / テスト / 復習 | wordbooks, words, taggedWords |
| 学習記録 `/study-records` | streak + 週ストリーク（月曜始まり）/ カレンダー（月送り・日別詳細）/ 直近一覧のタブ | me（streak）, studyRecords(year, month), studyRecordsWeek, studyRecordsRecent |
| マイページ `/my-page` | streak / 登録単語数 / プロフィール編集 | me, totalWords |
| 管理 `/admin/*` | 公式単語帳 CRUD / CSV / ユーザー一覧 / 統計 | adminWordbooks, adminUsers, adminStats |

- 各ホームセクションは**自己完結ウィジェット**（内部でローディング・エラー・フォールバックを処理）。構成変更はセクションの並べ替えだけで済む。
- `DailyWord` は取得失敗時に内蔵 `fallbackWords` からランダム 1 件を表示し、初回ロードの空白を防ぐ。

## 5. テスト機能のフロー（v1 のロジックを維持）

1. `useWords`（v2: GraphQL クエリ）の結果をシャッフルしてから `Test` に渡す。シャッフルは `startTransition` で低優先度化し UI をブロックしない。
2. 「答えを見る」→ 正誤判定。誤答時の復習タグは自動登録しない。結果画面の「間違えた単語を復習リストに登録」（`useSnackbar().confirm` で確認）で未登録の誤答単語をまとめて `addTaggedWord` する（登録済みになるとボタンは消える）。単語一覧のタグアイコンも付け外し両方向で confirm を挟む（mutation → refetch の反映待ちで未登録に見える誤解を防ぐ）。
3. テスト終了（`currentIndex >= total`）を `useEffect` で検知し、`createStudyRecord`（履歴）と `completeWordbookProgress`（進捗）を発火。
4. **冪等性**：`hasPostedRef = useRef(false)` で Strict Mode の二重実行・二重送信を防止。

実装状況：`/wordbooks/[id]/test`（WordbookTest）は #10 で 2〜4 を接続済み
（`completeWordbookProgress` は章の解放が対象のため自作単語帳では発火しない）。
`/wordbooks/review`（復習単語一覧）はタグ付き単語（単語帳横断）を並べ、「今すぐはじめる」で
`/wordbooks/review/test`（復習専用テスト）へ進む（自作単語帳の 一覧 → テスト と同じ導線。
ホーム・単語帳一覧の復習バッジは一覧へ飛ぶ）。復習専用テストは復習タグ付き単語を出題し、
記録は `kind: REVIEW`（単語帳なし）で保存する（通常のテストは `kind: WORDBOOK` + wordbookId）。
`/publicWordbooks/.../test`（PublicWordbookTest）は復習タグをバックエンド保存（`ReviewTagProvider`）に接続済みで、
誤答の一括登録は自作単語帳と同じく復習単語一覧に反映される。完了時は学習記録も保存する
（`kind: WORDBOOK` + 章の単語帳 ID を wordbookId に渡す。自作単語帳のテストと同じ方式）。
章の完了（次 Part 解放）もバックエンド保存（`completeWordbookProgress`）に接続済みで、教材トップの解放状態に反映される（→ §3）。

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
- 記録系クエリ（`studyRecords` / `studyRecordsWeek` / `studyRecordsRecent`）は `cache-first` のため、
  `createStudyRecord` の `update` で該当フィールドを `cache.evict` し、保存後の次回表示時に再取得させる。

## 8. その他の UI / UX 指針（踏襲）

- 未ログイン・通信失敗時のフォールバック（リッチな空状態、「ログイン / 新規登録」への導線）。
- **window.confirm / window.alert は使わない**。`components/feature/SnackbarProvider` の `useSnackbar()` を使う：`confirm(message)` は画面全体を暗転させ中央にカード型ダイアログ（キャンセル / OK は flex 均等幅）を出して `Promise<boolean>` を返す。`notify(message)` は confirm と同じ画面中央に一定時間表示して自動で消える（暗転しない非モーダル通知）。`app/providers.tsx` でアプリ全体に mount 済み。
- 週初めを月曜に補正：`(jsDay - 1 + 7) % 7`。
- メタデータ（title / description）と多言語フォント（Noto Sans JP 等）を `RootLayout` で設定。
- 入力欄は `autoComplete="off"` をデフォルトに（テスト中の意図しない補完を防止）。
- 単語帳の説明など長文入力への **TipTap** 導入は予定のみ（未導入）。

## 9. v1 → v2 移行で注意する点

- React Query 由来の `enabled` / `setQueryData` / `invalidateQueries` は、Apollo の `skip` / `cache.writeQuery` / `refetchQueries` に対応づける。
- 自作 UI（CSS Modules / Tailwind）から MUI への載せ替えは、まず汎用パーツ（Button / Input / Card）から着手し、画面側の構造は維持する。
- GraphQL Codegen は導入済み（`postinstall` / `predev` / `prebuild` + CI で自動生成）。スキーマとフロント型の乖離をビルド時に検出する。運用手順は [graphql.md](./graphql.md)。
