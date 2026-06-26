Playwright E2E テストを実行してください。

## 前提条件

- Docker コンテナ（frontend: localhost:3200、backend: localhost:3100）が起動済みであること
- ホスト側（Windows）から Playwright を実行する（Docker 内ではなくホストで実行）

## 手順

1. `packages/frontend` ディレクトリで以下のコマンドを実行する
2. 結果を日本語で分かりやすく報告する
3. 失敗したテストがあれば、エラー内容と原因を説明する

## 引数の扱い

- 引数なし（例: `/e2e`）→ ヘッドレスで全テストを実行
- `headed`（例: `/e2e headed`）→ ブラウザ表示ありで実行
- `ui`（例: `/e2e ui`）→ UI モード（デバッグ用）で実行
- ファイル名（例: `/e2e e2e/home.spec.ts`）→ 指定ファイルのみ実行

## コマンド

```bash
# ヘッドレス（デフォルト）
cd packages/frontend && yarn e2e

# ブラウザ表示あり
cd packages/frontend && yarn e2e --headed

# UI モード（デバッグ用）
cd packages/frontend && yarn e2e --ui

# 特定ファイルのみ
cd packages/frontend && yarn e2e $ARGUMENTS
```

$ARGUMENTS の内容に応じて適切なコマンドを選択してください。

## 注意

- E2E テストは development DB に対して実行される（テスト専用 DB ではない）
- 初回または DB リセット後は seed データの投入が必要:
  `docker compose exec backend rails db:seed`
