# 開発フロー

MemoRise v2 の開発の進め方。ソロ開発でも Issue → ブランチ → PR → 自己レビュー → マージの流れを徹底し、履歴をそのまま開発プロセスの記録にする。

## 基本サイクル

1. **Issue を立てる**（1 タスク = 1 Issue）。`docs/backlog.md` のエピックを起点に、ゴールと受け入れ条件を書く。
2. **ブランチを切る**：`<種別>/issue-<Issue番号>`（例 `feature/issue-44`、`chore/issue-1`）。`main` には直接コミットしない。
3. **実装 + テストを同じ PR で書く**（下記 Definition of Done）。
4. **コミットは Conventional Commits**：`feat:` `fix:` `chore:` `docs:` `refactor:` `test:`。本文に `#5` を書くと Issue に紐づく。
5. **PR を作成し自己レビュー**：説明に `Closes #5`。GitHub の Files changed タブで差分を通読。PR テンプレのチェックを埋める。
6. **CI グリーンを確認**してから **Squash and merge**。マージ後にブランチ削除。

## ブランチ命名

形式は `<種別>/issue-<Issue番号>`。番号は対応する Issue 番号。

| 種別 | 例 |
| --- | --- |
| 機能 | `feature/issue-44` |
| 修正 | `fix/issue-31` |
| 雑務・基盤 | `chore/issue-1` |
| ドキュメント | `docs/issue-7` |

## Definition of Done（各機能 Issue 共通）

- [ ] 実装が受け入れ条件を満たす
- [ ] **RSpec**：モデルのドメインロジック + GraphQL の Query/Mutation（正常系 + 認可/異常系）
- [ ] **GraphQL を変更した場合**：`bin/rails graphql:schema:dump` で `schema.graphql` を再生成してコミット（フロントの型はこれを元に生成。手順は [graphql.md](./graphql.md)）
- [ ] **Playwright E2E**：代表導線を 1 本以上
- [ ] ローカルで `rspec` / `playwright test` がグリーン
- [ ] CI がグリーン
- [ ] 自己レビュー済み

## テストの回し方

バックエンド（RSpec）:
```bash
docker compose exec backend bundle exec rspec
# Docker を使わない場合: cd packages/backend && bundle exec rspec
```

フロントエンド（Playwright E2E）:
```bash
cd packages/frontend
npx playwright install   # 初回のみ
npm run e2e
```

CI（GitHub Actions / `.github/workflows/ci.yml`）が PR ごとにフロント（lint/build/e2e）とバック（rubocop/rspec）を自動実行する。`main` は **branch protection** で「PR 必須・CI グリーン必須・直 push 禁止」に設定する（GitHub の Settings → Branches）。

## DB リセット（開発時のみ）

開発中に DB を初期化したいときの手順。**既存データはすべて削除される**ため、開発環境でのみ使う。

現状（マイグレーション・Solid Queue 未導入）:
```bash
docker compose exec backend bin/rails db:drop db:create db:migrate
```

Solid Queue 導入後（`docker-compose.yml` の `worker` を有効化したあと）は、reset 後に worker を再起動しないと SolidQueue がクラッシュループになるため、**必ずセットで**実行する:
```bash
rm -rf packages/backend/db/schema.rb
docker compose exec backend bin/rails db:drop db:create db:migrate
docker compose restart worker
```

補足:
- リリース前の開発時のみ使用する
- 既存データはすべて削除される
- `db:reset`（= drop→create→schema:load→seed）後も同様に worker 再起動が必要

## コミットメッセージ例

```
feat: 単語帳の作成・編集・削除を実装 (#8)

- GraphQL に createWordbook / updateWordbook / deleteWordbook を追加
- 論理削除（deleted_at）に対応
- RSpec（認可含む）と Playwright E2E を追加
```
