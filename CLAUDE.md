# CLAUDE.md

MemoRise v2 — 単語暗記学習アプリのモノレポ（`packages/frontend` + `packages/backend`）。
v1（兄弟ディレクトリ `../MemoRise`）を Rails + GraphQL + Next.js で作り直したもの。

## 大方針

- **既存のコード規約・実装パターンに従う**。新しい実装は必ず既存の類似コードを先に読み、
  このプロジェクトで使われている書き方（命名・構成・ライブラリの使い方）に合わせる。
  急に独自の関数やプロジェクトで使っていない手法を持ち込まない。
- **UI は memorise v1 に寄せて作る**。原典は `../MemoRise`（設計は `../MemoRise/design.md`）。
  簡素な代替 UI で済ませない。API 未実装の機能はクライアント側の一時状態でフォールバックして
  見た目を先行再現し、必ずスクリーンショットで確認する。
- **無駄なファイルを作成しない**。使い捨てスクリプトや不要な抽象化ファイルを増やさず、
  既存ファイルの編集を優先する。一時ファイルが必要ならリポジトリ外（scratchpad）に置く。
- **`.env` と `.env.example` は読み込まない**（参照・出力とも禁止）。

## 構成と詳細パス

### フロントエンド `packages/frontend`（Next.js 16 + React 19 + MUI 7 + Apollo Client 4、port 3200）

- `src/app/` — App Router。`(public)`（ログイン・新規登録）/ `(auth)`（要ログイン: wordbooks, basicWord 等）/ `(admin)`（管理者）
- `src/components/common/` — 汎用部品（`card/WordCard` など）・`ui/`
- `src/components/feature/` — Provider 類（AuthProvider / SnackbarProvider / *SessionProvider）
- `src/components/layout/` — 共通シェル（Layout / Header / Footer / *Layout）
- `src/graphql/queries/`・`src/graphql/mutations/` — 手書きの GraphQL オペレーションと hooks ラッパー
- `src/gql/` — codegen 生成物（**手で編集しない**）
- `src/constants/` — Server/Client 共有の定数（"use client" ファイルから定数を import しない）
- `src/theme/` / `src/lib/` — MUI テーマ（dark）/ ユーティリティ
- `e2e/` — Playwright（`packages/frontend` で `npx playwright test --reporter=line`）

### バックエンド `packages/backend`（Rails 8.1 API + graphql-ruby + PostgreSQL 16、port 3100）

- `app/graphql/` — スキーマ・types・mutations・resolvers
- `app/models/` / `db/` / `spec/`
- `schema.graphql` — GraphQL 変更時に `bin/rails graphql:schema:dump` で再生成してコミット
  （フロントの codegen がこれを読む。手順は `docs/graphql.md`）

### ドキュメント `docs/`

- `docs/requirements.md` — 要件
- `docs/frontend.md` — フロントエンド詳細設計
- `docs/backend.md` — バックエンド詳細設計
- `docs/graphql.md` — GraphQL 運用（schema dump → codegen）
- `docs/tech-stack.md` / `docs/migration-rationale.md` — 技術選定・v1 からの変更理由
- `docs/workflow.md` — 開発フロー / `docs/backlog.md` — エピック

## よく使うコマンド

```bash
# フロント（ルートから）
npm run dev:front            # 開発サーバー（http://localhost:3200）
npm run build:front          # ビルド
npm run codegen              # GraphQL 型生成

# E2E（packages/frontend で）
npx playwright test e2e/xxx.spec.ts --reporter=line

# バックエンド
docker compose up            # 全サービス起動（BE: http://localhost:3100）
docker compose exec -e RAILS_ENV=test backend bundle exec rspec
# ※ RAILS_ENV=test を明示しないと dev DB に対して走るので注意
```

## 開発フロー

Issue → ブランチ `<種別>/issue-<番号>`（例 `feature/issue-8`）→ 実装 + テスト同一 PR →
自己レビュー → CI グリーン → Squash and merge。コミットは Conventional Commits。
詳細と Definition of Done は `docs/workflow.md`。

## 実装規約

- **GraphQL クエリは current_user スコープ**：単語帳等は `user_id` 引数でなく context の
  current_user から引く。クエリの失敗は raise。
- **mutation は success/errors 方式**：例外でなく `{ success, errors: [{ field, message }] }`
  を返す（認可失敗も errors に載せる）。
- **列挙の分け方**：カテゴリ値 = Rails 定数配列 + FE 表示名マップ、status = Rails enum +
  GraphQL enum。値の検証はバックエンドで行う。
- **window.confirm / window.alert は禁止**：`components/feature/SnackbarProvider` の
  `useSnackbar()`（confirm = 暗転 + 中央モーダル / notify = 下部通知）を使う。
- **単語テキストは省略しない**：WordCard の question / answer は ellipsis・1 行制限をせず
  折り返しで全文表示。狭い画面ではアイコン側を「…」メニューに集約する。
- Apollo v4 の useQuery ラッパーで options をスプレッドしない（DeepPartial に落ちて
  ビルドが壊れる）。パススルー方式にする。
