開発環境にデモ用データ（管理者ユーザー + デモ公式単語帳）を一括作成してください。

## 手順

1. 以下のコマンドを上から順に実行する
2. それぞれの結果を日本語で分かりやすく報告する
3. エラーがあれば内容と原因を説明する

## コマンド

```bash
docker compose exec backend bin/rails admin:create
docker compose exec backend bin/rails demo:wordbooks
```

## 補足

- **development 環境専用**（各 rake タスク側で `Rails.env` をガード。development 以外では中断する）
- すべて**冪等**：既に存在すれば作り直さない（何度実行してもOK）
- `admin:create` … 固定の管理者 `admin@example.com` / `password`。管理者は signUp / 画面から作成できない設計のため、`/admin-login` の動作確認はこれで作った管理者を使う
- `demo:wordbooks` … デモ公式単語帳（`【DEMO】…` の 親 → 章 → 単語）。一覧 → 親 → 章 → 単語の導線確認用
- 事前に backend コンテナが起動していること（`docker compose up -d db backend`）
