# 技術スタック

モノレポ構成（`packages/frontend` + `packages/backend`）。

## フロントエンド

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16（App Router） / React 19 |
| 言語 | TypeScript 5 |
| UI | MUI 7（material / icons-material / x-date-pickers） + Emotion |
| データ通信 | Apollo Client 4 / GraphQL 16 |
| 型生成 | GraphQL Codegen |
| リッチテキスト | TipTap 3 |
| その他 | dayjs（日付） / RxJS / @rails/activestorage |
| テスト | Playwright（E2E） |
| 静的解析 | ESLint 9 |
| パッケージ管理 | Yarn 4.9.4（Node 22.15.0） |

## バックエンド

| 分類 | 技術 |
| --- | --- |
| フレームワーク | Ruby on Rails 8.1（API モード） / Ruby 3.4.5 |
| API | GraphQL（開発時 GraphiQL） |
| データベース | MySQL 8.0（mysql2） |
| ジョブ / キャッシュ | Solid Queue / Solid Cache / Solid Cable（すべて MySQL ベース、**Redis 不使用**） |
| ジョブ監視 | Mission Control - Jobs |
| Web サーバー | Puma（+ Propshaft / Thruster） |
| 認証 | bcrypt（has_secure_password） |
| セッション | activerecord-session_store（DB 管理） |
| ページネーション | Kaminari |
| 環境変数 | dotenv-rails |
| CORS | rack-cors |
| AWS 連携 | SES v2（メール） / S3 + Active Storage + image_processing（画像） / aws-sdk-rails |
| テスト | RSpec |
| 品質・セキュリティ | RuboCop（omakase） / Brakeman / bundler-audit |
| デプロイ | Kamal |

## インフラ・開発環境

| 分類 | 技術 |
| --- | --- |
| 開発環境 | Docker Compose（db / backend / worker / frontend の 4 サービス） |
| 本番 | AWS |
| タイムゾーン | JST（`config.time_zone = "Tokyo"`） |

## 特徴

キュー・キャッシュ・セッションをすべて MySQL に寄せ、**Redis を使わない** Rails 8 の Solid 系構成。インフラをシンプルに保つ設計になっている。