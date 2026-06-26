GraphQL Code Generator を実行して、型定義と React hooks を自動生成してください。

## 手順

1. 以下のコマンドで codegen を実行する
2. 結果を日本語で分かりやすく報告する
3. エラーがあれば内容と原因を説明する

## コマンド

```bash
rm -f packages/frontend/src/graphql/*/generated/*.ts
docker compose exec -e NEXT_PUBLIC_API_URL=http://backend:4000 frontend yarn codegen
```

## 補足

- `.graphql` ファイルを編集した後に実行する
- 生成ファイルは `src/graphql/mutations/generated/` と `src/graphql/queries/generated/` に出力される
- 実行前に既存の生成ファイルを削除することで、削除済み `.graphql` に対応する孤立ファイルを防ぐ
