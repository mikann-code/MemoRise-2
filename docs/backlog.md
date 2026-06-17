# 開発バックログ（v1 完全反映 / エピック単位 15 Issue）

> v1 の全機能を v2（GraphQL / Apollo / MUI / Rails 8）で再実装するための、エピック粒度のバックログ。
> 1 Issue ≒ 縦切り（バックエンド→フロントまで1機能が動く単位）。上から順に着手するのが自然。
> 各 Issue はそのまま GitHub Issue に貼れる。`Closes #n` で PR と紐づける運用を想定。
> 関連設計：[requirements.md](./requirements.md) / [backend.md](./backend.md) / [frontend.md](./frontend.md)

ラベル例：`epic` `backend` `frontend` `infra` / 優先度 `P0`(基盤) `P1`(主要) `P2`(仕上げ)

---

## テスト方針（Definition of Done）

各機能 Issue は「実装 + 対応するテスト」が揃って初めて完了とする（PR テンプレのチェックリストにも入れる）。テストは最後にまとめず、**機能ごとに同じ PR で**書く。

- **バックエンド（RSpec）**：モデルの単体（バリデーション・ドメインロジック：`update_streak!` / 章の解放 / `user_consistency` / `correct_not_exceed_count` 等）と、GraphQL の Query/Mutation のリクエストスペック（正常系 + 認可：未認証・権限違いで弾かれること）
- **フロント E2E（Playwright）**：その機能の代表的なユーザー操作を最低 1 本（例：ログイン → テスト → 学習記録が残る）
- **フロント単体（任意）**：冪等なテスト終了処理・シャッフルなど純粋ロジックは Vitest + Testing Library
- **CI（#1）** で RSpec / Playwright を PR ごとに自動実行し、グリーンをマージ条件にする

ツール：backend = `rspec-rails`（+ `factory_bot_rails` / `shoulda-matchers` 任意）、frontend E2E = `@playwright/test`、frontend 単体（任意）= Vitest + Testing Library。

各機能 Issue（#5〜#14）の受け入れ条件には、共通で次の 2 つが付くものとする：
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本

---

## #1 開発基盤の確立（CI / Issue・PR テンプレ / branch protection）
**P0 / infra**
スキャフォルドは作成済み。開発フローと**テスト基盤**の土台を固め、#2 以降は最初からテストを書ける状態にする。
- [ ] `.github/ISSUE_TEMPLATE`（feature / bug）と `pull_request_template.md`（テスト実施チェック付き）を追加
- [ ] RSpec セットアップ（`rspec-rails` install、`factory_bot_rails`、`spec/` 雛形、サンプル spec 1 本）
- [ ] Playwright セットアップ（`@playwright/test`、設定、サンプル E2E 1 本）
- [ ] GitHub Actions CI：フロント（lint + build + Playwright）/ バック（RuboCop + RSpec）を PR で実行
- [ ] `main` に branch protection（PR 必須・CI グリーン必須・直 push 禁止）
- [ ] `docs/workflow.md` に開発フロー（Issue→ブランチ→PR→テスト→マージ）を記載

## #2 データモデルとマイグレーション
**P0 / backend** ／ blocked by: #1
v1 スキーマ（8 テーブル）を Rails で再現する。
- [ ] `users` / `admin_users` / `wordbooks` / `words` / `study_records` / `study_details` / `user_word_tags` / `user_wordbook_progresses` のマイグレーション
- [ ] モデル定義・関連（自己参照の親子、counter_cache、論理削除 scope）
- [ ] ユニーク制約・カスタムバリデーション（user_consistency / correct_not_exceed_count）
- [ ] `User#update_streak!`・`after_create` 既定単語帳生成などドメインロジック
- [ ] `db:seed`（公式単語帳・管理者ユーザーの最小データ）

## #3 GraphQL 基盤
**P0 / backend** ／ blocked by: #2
- [ ] `MemoRiseSchema`・base types・エラーハンドリング・DataLoader
- [ ] context に `current_user` / `current_admin` を載せる仕組み
- [ ] GraphiQL（開発時）で疎通確認
- [ ] スキーマ出力（フロント codegen 用）

## #4 フロントエンド基盤
**P0 / frontend** ／ blocked by: #3
- [ ] Apollo Client を一般用 / 管理者用で分離（トークン・キャッシュ空間）
- [ ] MUI テーマ・CssBaseline・App Router キャッシュ
- [ ] Route Group レイアウト（`(public)` `(semi-auth)` `(auth)` `(admin-user)`）と認証ガード
- [ ] 共通 UI（Button / Input / Card / Layout）と GraphQL Codegen パイプライン

## #5 認証（一般ユーザー）
**P1 / backend + frontend** ／ blocked by: #4
- [ ] サインアップ（名前・メール・パスワード、初期単語帳自動生成）
- [ ] ログイン / ログアウト（トークン保存・Cookie 設定）
- [ ] `me` 取得と未認証時のハンドリング
- [ ] ログイン / 新規登録画面（FormLayout）

## #6 管理者認証とスコープ分離
**P1 / backend + frontend** ／ blocked by: #4
- [ ] 管理者ログイン・`adminMe`
- [ ] Resolver 認可（admin context 必須の Mutation/Query）
- [ ] `/admin-login` 画面・AdminLayout のガード（role 不一致は redirect）

## #7 公式単語帳の閲覧
**P1 / backend + frontend** ／ blocked by: #5
- [ ] 公式単語帳の親一覧 → 子（章）→ 単語の取得（読み取り専用）
- [ ] ラベル / レベル / パートの表示
- [ ] `/basicWordList`・`/basicWord/[parentId]`・子の一覧/テスト導線

## #8 自作単語帳・単語の CRUD
**P1 / backend + frontend** ／ blocked by: #5
- [ ] 単語帳の作成・編集・削除（論理削除）
- [ ] 単語の追加・編集・削除
- [ ] `/wordbooks`・`/wordbooks/new`・`/wordbooks/[id]/edit`・`/wordbooks/[id]/list`

## #9 単語テスト機能
**P1 / frontend（+ backend 連携）** ／ blocked by: #7, #8
- [ ] 出題シャッフル（startTransition）
- [ ] 「答えを見る」→ 正誤判定（answer を見るまで判定不可）
- [ ] 正答率ゲージ・結果画面
- [ ] WordCard をテスト中 / 結果 / 一覧で共通利用

## #10 学習記録の保存と復習タグ
**P1 / backend + frontend** ／ blocked by: #9
- [ ] テスト終了時に記録＋進捗を 1 回だけ保存（冪等・トランザクション）
- [ ] 誤答単語を復習タグへ自動登録
- [ ] 復習専用テスト `/wordbooks/review`
- [ ] ホーム等に復習件数バッジ

## #11 学習記録の可視化
**P1 / backend + frontend** ／ blocked by: #10
- [ ] 記録 API（月指定 / 週 / 直近）
- [ ] カレンダー表示（月送り）
- [ ] streak・週ストリーク（月曜始まり補正）
- [ ] `/study-records`

## #12 ホーム画面
**P1 / frontend** ／ blocked by: #7, #11
- [ ] 今日の一問（公式・復習から1問、未取得時フォールバック）
- [ ] 公式 / 自作への導線・週 streak の 4 セクション合成
- [ ] 未ログイン時のリッチな空状態（ログイン / 新規登録導線）

## #13 マイページ・プロフィール・章の解放
**P1 / backend + frontend** ／ blocked by: #10
- [ ] マイページ（streak・登録単語数）
- [ ] プロフィール編集（キャッシュ即時反映）
- [ ] 進捗（章の解放：完了で次パート解放、lazy initialization）

## #14 管理者機能
**P1 / backend + frontend** ／ blocked by: #6
- [ ] 公式単語帳の作成・編集・削除（親更新→子伝播）
- [ ] CSV 一括登録（行番号付きエラー）
- [ ] ユーザー一覧
- [ ] 統計

## #15 仕上げ（カバレッジ / SEO / デプロイ）
**P2 / infra + backend + frontend** ／ blocked by: 主要機能完了後
> テストは各機能 Issue で随時書く方針（上記 Definition of Done）。ここでは取りこぼしの補完と全体品質を担保する。
- [ ] テストの抜け漏れ補完・カバレッジ確認、E2E のクリティカルパス通し（ログイン→学習→記録→復習）
- [ ] SEO（metadata）・フォント・日本語ロケール・JST 最終確認
- [ ] 本番デプロイ（Kamal / AWS）・ヘルスチェック・CORS 本番設定
- [ ] README / docs の最終更新

---

## GitHub への登録メモ

- マイルストーン例：`M1 基盤(#1-#4)` / `M2 学習コア(#5,#7-#12)` / `M3 管理・進捗(#6,#13,#14)` / `M4 仕上げ(#15)`
- `gh` CLI を使うなら、各 Issue を次の形で一括作成できる：
  ```bash
  gh issue create --title "#2 データモデルとマイグレーション" --body "（上記の受け入れ条件）" --label epic,backend
  ```
- 着手時にブランチ：`<種別>/issue-<Issue番号>`（例 `feature/issue-5`、`chore/issue-1`）、PR 説明に `Closes #5`。
