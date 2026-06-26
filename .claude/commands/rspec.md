RSpec テストを実行してください。

## 手順

1. 以下のコマンドで RSpec を実行する
2. 結果を日本語で分かりやすく報告する
3. 失敗したテストがあれば、エラー内容と原因を説明する

## 引数の扱い

- 引数なし（例: `/rspec`）→ 全テストを実行
- 引数あり（例: `/rspec spec/graphql/mutations/login_spec.rb`）→ 指定ファイルのみ実行

## コマンド

```bash
# 全テスト実行（引数なし時）
docker compose exec backend bundle exec rspec

# 特定ファイル実行（引数あり時）
docker compose exec backend bundle exec rspec $ARGUMENTS
```

$ARGUMENTS が指定されていれば特定ファイル、なければ全テストを実行してください。
