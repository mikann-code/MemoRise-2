DB をリセットしてください。

## 手順

1. 以下のコマンドを順番に実行する
2. 各ステップの結果を日本語で報告する
3. エラーがあれば内容と原因を説明する

## コマンド

```bash
rm -Rf packages/backend/db/schema.rb
docker compose exec backend rails db:drop db:create db:migrate 2>&1
docker compose restart worker
```

## 補足

- リリース前の開発時のみ使用する
- 既存データはすべて削除される
