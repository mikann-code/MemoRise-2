# MemoRise v2 - Issue 一括作成スクリプト（gh CLI / PowerShell）
#
# 前提:
#   - gh CLI 認証済み（`gh auth status` で確認）
#   - リポジトリのルート（MemoRise#2）で実行
#   - 既存 Issue が無い状態で実行すると #1〜#15 に対応する
#
# 実行: powershell -ExecutionPolicy Bypass -File scripts/create-issues.ps1

$ErrorActionPreference = "Stop"

# --- ラベル整備（無ければ作成 / あれば更新） ---
$labels = @(
  @{ name = "epic";     color = "5319e7" },
  @{ name = "backend";  color = "1d76db" },
  @{ name = "frontend"; color = "0e8a16" },
  @{ name = "infra";    color = "b60205" },
  @{ name = "feature";  color = "a2eeef" },
  @{ name = "bug";      color = "d73a4a" }
)
foreach ($l in $labels) {
  gh label create $l.name --color $l.color --force | Out-Null
}

# --- Issue 定義（上から順に #1..#15） ---
$issues = @()

$issues += @{ labels = "epic,infra"; title = "開発基盤の確立（CI / テンプレ / テスト基盤 / 開発フロー）"; body = @"
## 概要 / ゴール
開発フローとテスト基盤の土台を整備し、#2 以降は最初からテストを書ける状態にする。

## 受け入れ条件
- [ ] Issue / PR テンプレート（.github）を追加
- [ ] RSpec セットアップ（rspec-rails / factory_bot / サンプル spec）
- [ ] Playwright セットアップ（@playwright/test / 設定 / サンプル e2e）
- [ ] GitHub Actions CI（フロント: lint・build・e2e / バック: rubocop・rspec）
- [ ] main に branch protection（PR 必須・CI グリーン必須・直 push 禁止）
- [ ] docs/workflow.md に開発フローを記載
"@ }

$issues += @{ labels = "epic,backend"; title = "データモデルとマイグレーション"; body = @"
## 概要 / ゴール
v1 スキーマ（8 テーブル）を Rails で再現する。

## 受け入れ条件
- [ ] users / admin_users / wordbooks / words / study_records / study_details / user_word_tags / user_wordbook_progresses のマイグレーション
- [ ] モデル定義・関連（自己参照の親子、counter_cache、論理削除 scope）
- [ ] ユニーク制約・カスタムバリデーション（user_consistency / correct_not_exceed_count）
- [ ] User#update_streak! ・ after_create 既定単語帳生成
- [ ] db:seed（公式単語帳・管理者ユーザーの最小データ）
- [ ] モデルの RSpec（バリデーション・ドメインロジック）
"@ }

$issues += @{ labels = "epic,backend"; title = "GraphQL 基盤"; body = @"
## 概要 / ゴール
GraphQL の土台（schema・型・認可コンテキスト・DataLoader）を用意する。

## 受け入れ条件
- [ ] MemoRiseSchema・base types・エラーハンドリング・DataLoader
- [ ] context に current_user / current_admin を載せる仕組み
- [ ] GraphiQL（開発時）で疎通確認
- [ ] スキーマ出力（フロント codegen 用）
- [ ] リクエストスペックの雛形（health 等）
"@ }

$issues += @{ labels = "epic,frontend"; title = "フロントエンド基盤"; body = @"
## 概要 / ゴール
Apollo / MUI / Route Group / codegen のフロント基盤を整える。

## 受け入れ条件
- [ ] Apollo Client を一般用 / 管理者用で分離（トークン・キャッシュ空間）
- [ ] MUI テーマ・CssBaseline・App Router キャッシュ
- [ ] Route Group レイアウト（(public)/(semi-auth)/(auth)/(admin-user)）と認証ガード
- [ ] 共通 UI（Button / Input / Card / Layout）と GraphQL Codegen パイプライン
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "認証（一般ユーザー）"; body = @"
## 概要 / ゴール
一般ユーザーのサインアップ / ログイン / ログアウトを実装する。

## 受け入れ条件
- [ ] サインアップ（名前・メール・パスワード、初期単語帳自動生成）
- [ ] ログイン / ログアウト（トークン保存・Cookie 設定）
- [ ] me 取得と未認証時のハンドリング
- [ ] ログイン / 新規登録画面（FormLayout）
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "管理者認証とスコープ分離"; body = @"
## 概要 / ゴール
管理者ログインと一般 / 管理者のスコープ分離を実装する。

## 受け入れ条件
- [ ] 管理者ログイン・adminMe
- [ ] Resolver 認可（admin context 必須の Mutation/Query）
- [ ] /admin-login 画面・AdminLayout のガード（role 不一致は redirect）
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "公式単語帳の閲覧"; body = @"
## 概要 / ゴール
公式単語帳（親→子→単語）の閲覧を実装する。

## 受け入れ条件
- [ ] 公式単語帳の親一覧 → 子（章）→ 単語の取得（読み取り専用）
- [ ] ラベル / レベル / パートの表示
- [ ] /basicWordList・/basicWord/[parentId]・子の一覧/テスト導線
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "自作単語帳・単語の CRUD"; body = @"
## 概要 / ゴール
自作単語帳と単語の作成・編集・削除を実装する。

## 受け入れ条件
- [ ] 単語帳の作成・編集・削除（論理削除）
- [ ] 単語の追加・編集・削除
- [ ] /wordbooks・/wordbooks/new・/wordbooks/[id]/edit・/wordbooks/[id]/list
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,frontend"; title = "単語テスト機能"; body = @"
## 概要 / ゴール
単語帳ごとのテスト実行（シャッフル・判定・正答率）を実装する。

## 受け入れ条件
- [ ] 出題シャッフル（startTransition）
- [ ] 「答えを見る」→ 正誤判定（answer を見るまで判定不可）
- [ ] 正答率ゲージ・結果画面
- [ ] WordCard をテスト中 / 結果 / 一覧で共通利用
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "学習記録の保存と復習タグ"; body = @"
## 概要 / ゴール
テスト終了時の記録保存と、誤答単語の復習タグ登録を実装する。

## 受け入れ条件
- [ ] テスト終了時に記録＋進捗を 1 回だけ保存（冪等・トランザクション）
- [ ] 誤答単語を復習タグへ自動登録
- [ ] 復習専用テスト /wordbooks/review
- [ ] ホーム等に復習件数バッジ
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "学習記録の可視化"; body = @"
## 概要 / ゴール
カレンダー・streak など学習記録の可視化を実装する。

## 受け入れ条件
- [ ] 記録 API（月指定 / 週 / 直近）
- [ ] カレンダー表示（月送り）
- [ ] streak・週ストリーク（月曜始まり補正）
- [ ] /study-records
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,frontend"; title = "ホーム画面"; body = @"
## 概要 / ゴール
今日の一問・各種導線・週 streak を合成したホームを実装する。

## 受け入れ条件
- [ ] 今日の一問（公式・復習から1問、未取得時フォールバック）
- [ ] 公式 / 自作への導線・週 streak の 4 セクション合成
- [ ] 未ログイン時のリッチな空状態（ログイン / 新規登録導線）
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "マイページ・プロフィール・章の解放"; body = @"
## 概要 / ゴール
マイページ表示・プロフィール編集・章の解放（進捗）を実装する。

## 受け入れ条件
- [ ] マイページ（streak・登録単語数）
- [ ] プロフィール編集（キャッシュ即時反映）
- [ ] 進捗（章の解放：完了で次パート解放、lazy initialization）
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,backend,frontend"; title = "管理者機能"; body = @"
## 概要 / ゴール
公式単語帳の管理・CSV 取込・ユーザー一覧・統計を実装する。

## 受け入れ条件
- [ ] 公式単語帳の作成・編集・削除（親更新→子伝播）
- [ ] CSV 一括登録（行番号付きエラー）
- [ ] ユーザー一覧
- [ ] 統計
- [ ] 該当ロジックの RSpec（正常系 + 認可/異常系）
- [ ] 代表導線の Playwright E2E を 1 本
"@ }

$issues += @{ labels = "epic,infra"; title = "仕上げ（カバレッジ / SEO / デプロイ）"; body = @"
## 概要 / ゴール
テストの抜け漏れ補完・SEO・本番デプロイなど全体品質を仕上げる。

## 受け入れ条件
- [ ] テストの抜け漏れ補完・カバレッジ確認、E2E のクリティカルパス通し
- [ ] SEO（metadata）・フォント・日本語ロケール・JST 最終確認
- [ ] 本番デプロイ（Kamal / AWS）・ヘルスチェック・CORS 本番設定
- [ ] README / docs の最終更新
"@ }

# --- 作成実行 ---
$n = 0
foreach ($i in $issues) {
  $n++
  Write-Host "Creating #$n : $($i.title)"
  gh issue create --title $i.title --label $i.labels --body $i.body
}

Write-Host "完了: $($issues.Count) 件の Issue を作成しました。"
