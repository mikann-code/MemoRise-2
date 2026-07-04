# 技術スタック

モノレポ構成（`packages/frontend` + `packages/backend`）。「予定」の行は設計上の採用予定で、現時点では未導入（導入時にこの表を更新する）。

## フロントエンド

| 分類 | 技術 | 状況 |
| --- | --- | --- |
| フレームワーク | Next.js 16（App Router） / React 19 | 導入済み |
| 言語 | TypeScript 5 | 導入済み |
| UI | MUI 7（material / icons-material / x-date-pickers） + Emotion | 導入済み |
| データ通信 | Apollo Client 4 / GraphQL 16 | 導入済み |
| 型生成 | GraphQL Codegen（client-preset） | 導入済み |
| 日付 | dayjs | 導入済み |
| テスト | Playwright（E2E） | 導入済み |
| 静的解析 | ESLint 9 | 導入済み |
| パッケージ管理 | npm workspaces（Node 22） | 導入済み |
| リッチテキスト | TipTap 3 | 予定 |

## バックエンド

| 分類 | 技術 | 状況 |
| --- | --- | --- |
| フレームワーク | Ruby on Rails 8.1（API モード） / Ruby 3.4.5 | 導入済み |
| API | GraphQL（graphql-ruby、開発時 GraphiQL） | 導入済み |
| データベース | PostgreSQL 16（pg） | 導入済み |
| Web サーバー | Puma | 導入済み |
| 認証 | bcrypt（has_secure_password） | 導入済み |
| セッション | activerecord-session_store（DB 管理） | 導入済み |
| 環境変数 | dotenv-rails | 導入済み |
| CORS | rack-cors | 導入済み |
| テスト | RSpec / FactoryBot / shoulda-matchers | 導入済み |
| 品質・セキュリティ | RuboCop（omakase） / Brakeman / bundler-audit | 導入済み |
| ジョブ / キャッシュ | Solid Queue / Solid Cache / Solid Cable（PostgreSQL ベース、**Redis 不使用**） | 予定 |
| ジョブ監視 | Mission Control - Jobs | 予定 |
| ページネーション | Kaminari | 予定 |
| AWS 連携 | SES v2（メール） / S3 + Active Storage + image_processing（画像） / aws-sdk-rails | 予定 |
| デプロイ | Kamal | 予定 |

## インフラ・開発環境

| 分類 | 技術 |
| --- | --- |
| 開発環境 | Docker Compose（db / backend / frontend の 3 サービス。ジョブ worker は Solid Queue 導入時に追加予定） |
| 本番 | AWS（予定） |
| タイムゾーン | JST（`config.time_zone = "Tokyo"`） |

## 特徴

キュー・キャッシュ・セッションをすべて PostgreSQL に寄せ、**Redis を使わない** Rails 8 の Solid 系構成を目指す（セッションは導入済み、キュー・キャッシュは予定）。インフラをシンプルに保つ設計になっている。
