# MemoRise

**単語暗記学習の「継続」を支援する Web アプリ。** 単語帳・テスト・学習記録を通じて、暗記の習慣化と進捗の可視化を実現します。

🔗 **本番デモ**: https://memo-rise-2.vercel.app

> スマホ（iPhone / Android）でもそのまま使えます。まずは新規登録、または公式単語帳の閲覧からお試しください。

---

## 目次

- [これは何か](#これは何か)
- [スクリーンショット](#スクリーンショット)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [アーキテクチャ（本番構成）](#アーキテクチャ本番構成)
- [設計上のこだわり](#設計上のこだわり)
- [開発プロセス](#開発プロセス)
- [ローカルでの起動](#ローカルでの起動)
- [ドキュメント](#ドキュメント)

---

## これは何か

「単語帳をめくるだけでは学習が習慣化しない」「間違えた単語が放置される」「取り組み量が可視化されずモチベーションが続かない」——
そんな暗記学習の課題を解決するために作った個人開発アプリです。

- **間違えた単語を確実に復習へ** — テストの誤答をまとめて復習リストへ登録し、苦手を積み残さない。
- **続けたくなる仕組み** — 連続学習日数（streak）と学習カレンダーで「積み上がっている感覚」を可視化。
- **すぐ始められる** — 公式単語帳をプリセットで用意し、自作の手間なく学習を開始できる。

v1（Rails + Next.js）を、**GraphQL / Apollo / MUI / Rails 8** の構成で作り直した v2 です。作り直しの背景は [docs/migration-rationale.md](./docs/migration-rationale.md) を参照。

---

## スクリーンショット

> 画面キャプチャは [docs/images/](./docs/images/) に配置します（順次追加）。

| ホーム（今日の一問 / streak / 復習バッジ） | 単語テスト |
| --- | --- |
| ![ホーム](./docs/images/home.png) | ![テスト](./docs/images/test.png) |

| 学習記録（カレンダー / streak） | 公式単語帳（親子階層） |
| --- | --- |
| ![学習記録](./docs/images/study-records.png) | ![公式単語帳](./docs/images/public-wordbooks.png) |

---

## 主な機能

- **ホーム** — 「今日の一問」、今週の streak、「あと N 個復習」バッジで学習導線を集約。
- **公式単語帳** — 運営が用意したプリセット（TOEIC / 英検 等）を親子階層（親カテゴリ → 章 / Day）で閲覧・テスト。
- **自作単語帳** — 単語帳・単語の作成 / 編集 / 削除（CRUD）。
- **単語テスト** — 出題 → 自己採点 → **誤答をまとめて復習リストへ登録**（確認モーダルつき）。
- **復習** — 復習タグの付いた単語だけを横断的にテスト。
- **学習記録** — 日次の学習量を記録し、カレンダー・streak で可視化。
- **マイページ** — プロフィール編集、公式単語帳の章の解放（進捗）。
- **管理者機能** — 公式単語帳の CRUD・CSV 一括登録、ユーザー一覧、統計閲覧（一般ユーザーとは**認証スコープを完全分離**）。

---

## 技術スタック

### フロントエンド

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16（App Router） / React 19 |
| 言語 | TypeScript 5 |
| UI | MUI 7（material / icons / x-date-pickers）+ Emotion |
| データ通信 | Apollo Client 4 / GraphQL 16 |
| 型生成 | GraphQL Code Generator（client-preset・スキーマ SDL 起点） |
| テスト | Playwright（E2E） |
| 静的解析 | ESLint 9 |
| パッケージ管理 | npm workspaces（Node 22） |

### バックエンド

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Ruby on Rails 8.1（API モード） / Ruby 3.4.5 |
| API | GraphQL（graphql-ruby、開発時 GraphiQL） |
| データベース | PostgreSQL 16 |
| Web サーバー | Puma |
| 認証 | bcrypt（has_secure_password）+ DB セッション（activerecord-session_store） |
| CORS | rack-cors |
| テスト | RSpec / FactoryBot / shoulda-matchers |
| 品質・セキュリティ | RuboCop（omakase） / Brakeman / bundler-audit |

詳細な採用理由は [docs/tech-stack.md](./docs/tech-stack.md) を参照。

---

## アーキテクチャ（本番構成）

FE = Vercel / BE = Render / DB = Neon（いずれもマネージド）。ブラウザからの GraphQL は
**同一オリジンの `/graphql`** で受け、Vercel のリライトでサーバー側から Render へ転送します。

```mermaid
flowchart LR
    U[ブラウザ / スマホ] -->|HTTPS| V[Vercel<br/>Next.js 16]
    V -->|/graphql を rewrites でプロキシ| R[Render<br/>Rails 8.1 API]
    R -->|SQL（pooled 接続）| N[(Neon<br/>PostgreSQL 16)]
```

| 層 | サービス | 補足 |
| --- | --- | --- |
| フロント | Vercel | Root Directory = `packages/frontend`。ビルド時に GraphQL Codegen を実行 |
| バック | Render（Docker / Singapore） | 起動時に `db:migrate`、ヘルスチェック `/up` |
| DB | Neon（PostgreSQL 16） | アプリは pooled 接続、マイグレーションは direct 接続 |

---

## 設計上のこだわり

- **認証は DB セッション（Cookie）方式** — トークンを手動管理せず、`session_id` のみを Cookie に載せ実体は DB（sessions テーブル）に保持。一般ユーザーと管理者で認証スコープ（`current_user` / `current_admin`）を完全分離。
- **クロスサイト / ITP 対策** — FE と BE が別ドメインのため、本番の Cookie は `SameSite=None; Secure`。さらに iOS/Safari のサードパーティ Cookie ブロック（ITP）を回避するため、`/graphql` を **同一オリジンにプロキシ**してファーストパーティ Cookie 化。
- **認可はリソース単位で「存在を教えない」** — 自作単語帳などは `user_id` 引数ではなく `current_user` スコープで引き、他人・対象外・論理削除済みは *not found* として扱う。
- **mutation は success / errors 方式** — 例外ではなく `{ success, errors: [{ field, message }] }` を返し、フォームは field 名でエラーを引く。
- **Redis を使わない構成** — セッション・（将来的にキュー / キャッシュ）を PostgreSQL に寄せ、インフラをシンプルに保つ Rails 8 の Solid 系方針。

---

## 開発プロセス

個人開発ながら、チーム開発を想定した運用で進めています。

- **Issue 駆動** — Issue → ブランチ `<種別>/issue-<番号>` → 実装 + テスト同一 PR → 自己レビュー → CI グリーン → Squash merge。
- **CI（GitHub Actions）** — PR ごとに以下を自動実行（[.github/workflows/ci.yml](./.github/workflows/ci.yml)）。
  - フロント：ESLint → `next build` → Playwright E2E
  - バック：RuboCop → RSpec
- **テスト方針**
  - BE：GraphQL は 1 オペレーション 1 spec（`spec/requests/graphql/`）。認可は context 注入で検証。
  - FE：E2E は `page.route("**/graphql")` で GraphQL をモックし、バックエンド非依存で機能単位に検証。
- **Conventional Commits** — type は英語、説明は日本語。

---

## ローカルでの起動

### A. Docker で全部立ち上げる（推奨）

```bash
# 1. 環境変数を用意
cp .env.example .env

# 2. ビルド → DB 作成・マイグレーション（初回のみ） → 起動
docker compose build
docker compose run --rm backend bin/rails db:create db:migrate
docker compose up
```

起動後：

- フロント：http://localhost:3200
- バックエンド（ヘルスチェック）：http://localhost:3100/up
- GraphQL エンドポイント：http://localhost:3100/graphql （POST）

疎通確認：

```bash
curl -X POST http://localhost:3100/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
# => {"data":{"health":"MemoRise GraphQL API is running"}}
```

### B. フロントだけ npm で立ち上げる

```bash
cd packages/frontend
cp .env.local.example .env.local   # 必要なら GraphQL URL を編集
npm install
npm run dev                        # http://localhost:3200
```

### GraphQL 型の自動生成（Codegen）

```bash
cd packages/frontend
npm run codegen   # スキーマ SDL から src/gql/ に型・フックを生成
```

> 前提バージョン：Node.js 22 / Ruby 3.4.5 / PostgreSQL 16。

---

## ドキュメント

- 要件定義：[docs/requirements.md](./docs/requirements.md)
- バックエンド設計：[docs/backend.md](./docs/backend.md)
- フロントエンド設計：[docs/frontend.md](./docs/frontend.md)
- GraphQL 運用（schema dump → codegen）：[docs/graphql.md](./docs/graphql.md)
- 技術スタック：[docs/tech-stack.md](./docs/tech-stack.md)
- v1 からの変更理由：[docs/migration-rationale.md](./docs/migration-rationale.md)
- 開発フロー：[docs/workflow.md](./docs/workflow.md)
