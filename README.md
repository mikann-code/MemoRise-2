# MemoRise v2

単語暗記学習の継続を支援する Web アプリの v2。モノレポ構成（`packages/frontend` + `packages/backend`）。

- 要件・設計：[docs/requirements.md](./docs/requirements.md) / [docs/backend.md](./docs/backend.md) / [docs/frontend.md](./docs/frontend.md)
- 技術スタック：[docs/tech-stack.md](./docs/tech-stack.md)
- v1 からの変更理由：[docs/migration-rationale.md](./docs/migration-rationale.md)

## 構成

```
MemoRise#2/
├── docker-compose.yml      # db / backend / (worker) / frontend
├── package.json            # ルート（npm workspaces）
├── packages/
│   ├── frontend/           # Next.js 16 + React 19 + MUI 7 + Apollo Client 4
│   └── backend/            # Rails 8.1 (API) + graphql-ruby + MySQL 8
└── docs/
```

## 前提

- **Docker で動かす場合**：Docker Desktop のみ
- **ローカルで直接動かす場合**：Node.js 22 / Ruby 3.4.5 / MySQL 8

---

## A. Docker で全部立ち上げる（推奨）

```bash
cd MemoRise#2

# 1. 環境変数を用意
cp .env.example .env

# 2. イメージをビルド
docker compose build

# 3. DB を作成・マイグレーション（初回のみ）
docker compose run --rm backend bin/rails db:create db:migrate

# 4. 起動
docker compose up
```

起動後（ポートは 3000 / 4000 を避けて設定）：

- フロント：http://localhost:3200
- バックエンド（ヘルスチェック）：http://localhost:3100/up
- GraphQL エンドポイント：http://localhost:3100/graphql （POST）

GraphQL の動作確認（別ターミナル）：

```bash
curl -X POST http://localhost:3100/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
# => {"data":{"health":"MemoRise GraphQL API is running"}}
```

---

## B. フロントだけ npm で立ち上げる

Docker を使わず、フロントエンド単体で開発したいとき。

```bash
cd packages/frontend
cp .env.local.example .env.local   # 必要なら GraphQL URL を編集
npm install
npm run dev
```

- http://localhost:3200 で起動
- バックエンドを別途起動しておくと GraphQL 通信まで確認できる

### バックエンドも Docker なしで動かす場合

```bash
cd packages/backend
cp .env.example .env       # MySQL の接続先を編集
bundle install
bin/rails db:create db:migrate
bin/rails server -p 3100   # http://localhost:3100
```

---

## GraphQL 型の自動生成（Codegen）

バックエンドを起動した状態で：

```bash
cd packages/frontend
npm run codegen   # スキーマから src/gql/ に型・フックを生成
```

---

## 注意点（初期スケルトン）

- `@apollo/client` v4 / `@mui/material-nextjs` はバージョンによって import パスが変わることがある。エラーが出たら該当箇所（`src/app/layout.tsx`・`src/app/providers.tsx`）を調整する。
- Solid Queue（ジョブ）は初期スケルトンでは未導入。導入時に `docker-compose.yml` の `worker` サービスのコメントを外す。
- メール（SES）・画像（S3 / Active Storage）・セッション・Kaminari などは設計（docs）に沿って順次追加する。
