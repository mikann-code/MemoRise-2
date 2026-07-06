# バックエンド設計（MemoRise v2）

> v1（Rails 8.1 API モード / REST / JWT / MySQL）のデータモデルとビジネスロジックを抽出し、v2 スタック（Rails 8.1 + **GraphQL（graphql-ruby）** + PostgreSQL + Solid Queue/Cache/Cable）前提で再構成したもの。ドメイン設計は v1 を踏襲し、API 表現を REST から GraphQL に置き換える。

## 1. 全体方針

- `ActionController::API` ベースの API 専用構成。認証は **DB セッション方式**（`activerecord-session_store`、Cookie `_memorise_session`。v1 の JWT から変更、経緯は [migration-rationale.md](./migration-rationale.md) §7）。
- v1 は名前空間 `api/v1`（一般）と `api/admin`（管理者）で物理分離していた。v2 では **GraphQL の単一エンドポイント**に統一しつつ、**認証コンテキスト（current_user / current_admin）と Resolver レベルの認可**で一般／管理者の境界を表現する。
- セッションは `activerecord-session_store`（PostgreSQL、導入済み）。キュー・キャッシュは
  **Solid 系（PostgreSQL ベース、Redis 不使用）を採用予定**だが現状未導入（Gemfile の NOTE 参照）。

## 2. データモデル

v1 のスキーマ（`schema.rb` version 2026_02_05）を踏襲する。

### users
| カラム | 型 | 備考 |
| --- | --- | --- |
| email | string | |
| name | string | |
| password_digest | string | bcrypt（has_secure_password） |
| role | string | default "user" |
| streak | integer | default 0（連続学習日数） |
| last_study_date | date | streak 計算用 |
| words_count | integer | counter_cache |

- `after_create :create_default_wordbook` で「はじめての単語帳」を自動生成。
- `update_streak!`：今日未更新かつ昨日学習済みなら +1、そうでなければ 1。`update_columns` で軽量更新、二度押し冪等。

### admin_users（設計案・未実装）
| カラム | 型 |
| --- | --- |
| email | string |
| password_digest | string |

- 設計では管理者を users と**別テーブル**で管理（権限境界の物理分離）としていたが、
  **現状は `users.role` で管理者を判定**しており `admin_users` テーブルは作っていない。
  別テーブル化するかは未確定（要決定）。

### wordbooks（公式・自作を 1 テーブルで表現）
| カラム | 型 | 備考 |
| --- | --- | --- |
| uuid | string | 外部公開 ID（unique） |
| title | string | not null |
| description | text | |
| user_id | bigint | nil = 公式 / 値あり = 自作 |
| is_official | boolean | default false |
| parent_id | bigint | 自己参照（親子階層） |
| label | string | junior_high / eiken / toeic / official 等 |
| level | string | |
| part | string | 章 |
| order_index | integer | 章の並び順 |
| last_studied | datetime | 「最近学習した順」ソート用 |
| deleted_at | datetime | 論理削除 |
| words_count | integer | counter_cache |

- 自己参照 1:N：`belongs_to :parent` / `has_many :children`。親 = TOEIC 等、子 = Day/章。
- ユニーク制約：`[parent_id, order_index]`、`[parent_id, part]`、`uuid`。同一親内の重複・順序衝突を DB レベルで防止。
- `scope :active, -> { where(deleted_at: nil) }`。削除は `update!(deleted_at: Time.current)`。

### words
| カラム | 型 | 備考 |
| --- | --- | --- |
| uuid | string | unique |
| question | string | not null |
| answer | string | not null |
| wordbook_id | bigint | counter_cache |
| user_id | bigint | 整合性チェック用 |

- v1 にあった `review` boolean は持たない。復習状態は `user_word_tags`（tag: "review"）で
  ユーザーごと・単語帳横断に表現する（§ user_word_tags）。

- カスタムバリデーション `user_consistency`：公式単語帳に user_id 付き単語は不可、自作単語帳に user_id なし単語は不可。

### study_records / study_details（学習履歴の正規化）
- **study_records**：`[user_id, study_date]` で UNIQUE。1 日 1 行に集約し `study_count` を累積。`memo` あり。
- **study_details**：`study_record_id` に紐づく個別記録。`title` / `rate`（正答率）/ `total_count` / `correct_count` / `chapter_wordbook_id`（学習した章への参照・章が消えても記録は残す nullify）。
- カスタムバリデーション `correct_not_exceed_count`：正答数は問題数を超えない。
- カレンダー集計（粗い粒度）と詳細表示（細かい粒度）を 1 構造で両立。

### user_word_tags（復習タグ）
| カラム | 型 |
| --- | --- |
| user_id | bigint |
| word_id | bigint |
| tag | string |

- `[user_id, word_id, tag]` で UNIQUE。同じ単語の二重タグを防止。
- 「間違えた単語」「あとで復習したい単語」を単語帳本体から外出しし、**単語帳横断**で扱う。

### user_wordbook_progresses（章の解放）
| カラム | 型 |
| --- | --- |
| user_id | bigint |
| wordbook_id | bigint |
| completed | boolean |

- `[user_id, wordbook_id]` で UNIQUE。
- 解放制御は**進捗レコードの存在**で表現。一覧取得時に最初のパートを遅延作成（lazy initialization）。

## 3. ドメインロジック（v2 でも維持）

- **テスト完了処理の原子性**：「日次サマリーの増分更新 + 詳細レコード追加」をトランザクション化。「履歴は残るが進捗が更新されない」等の不整合を防ぐ。
- **章の解放**：`complete` 操作で現在パートを完了し、`order_index` 昇順で次パートを `find_or_create_by!`。完了と解放を同一トランザクションで処理。
- **streak 更新**：モデル内 `update_streak!` にカプセル化。
- **今日の一問**：公式単語からランダム 1 件を返す軽実装。
- **CSV 一括登録（管理者）**：1 行 = 「問題,答え」（最初のカンマで 2 分割）。1 行ずつ単語を作成し、
  正常な行はそのまま登録（部分成功）、失敗した行は行番号付きエラーとして errors に載せる。
  `importedCount` で登録件数を返す（Ruby 3.4 で csv が既定 gem から外れたため、外部 gem に依存せず素朴に分割する）。

## 4. GraphQL スキーマ設計（v2 / REST からの移行）

v1 の REST エンドポイントを GraphQL の Query / Mutation にマッピングする。

> スキーマ（`schema.graphql`）の出力 → フロント型生成（Codegen）までの運用手順は [graphql.md](./graphql.md)。

**実装状況**（`schema.graphql` が正）：

- 実装済み Query：`health` / `me` / `adminMe` / `myWordbooks` / `myWordbook(id)` / `publicWordbooks` / `publicWordbook(id)` / `todayWord` / `totalWords` / `taggedWords` / `wordbookProgresses(wordbookId)` / `studyRecords(year, month)` / `studyRecordsWeek(startDate)` / `studyRecordsRecent` / `adminWordbooks` / `adminWordbook(id)` / `adminUsers(page, perPage, keyword, sortBy, sortOrder)` / `adminStats`
  - `adminWordbooks` は公式単語帳の教材（トップレベル・論理削除を除く）を order_index 昇順で返す。`adminWordbook(id)` は教材・章どちらの id でも引け、`children`（章）/ `words`（単語）まで辿れる管理用取得。`adminUsers` は全ユーザーをキーワード検索（`keyword`：name / email の部分一致・大小無視）・並び替え（`sortBy`：`CREATED_AT` / `WORDS_COUNT`、`sortOrder`：`ASC` / `DESC`、既定は登録日の降順）・ページング（`page` 1 始まり、`perPage` は 1〜100 にクランプ）して `AdminUsersResult { nodes, totalCount }` を返す（`totalCount` は絞り込み後・ページ分割前の総数）。`adminStats` はユーザー数・単語数・公式/自作単語帳数の集計。いずれも `require_admin!` でガード（失敗は FORBIDDEN を raise）。
  - `studyRecords` 系は current_user スコープで `study_details` 込みを返す（月別 = カレンダー用・日付昇順 / 週別 = startDate から 7 日分・週初めの月曜補正はフロント側 / 直近 = 新しい日付順・最大 30 件）。不正な年月は `BAD_REQUEST` を raise。
  - `todayWord` は公式単語帳の単語（論理削除済み単語帳を除く）からランダム 1 件を返す軽実装。公式単語が 0 件なら null（フロントは `fallbackWords` に切り替え）。要ログイン。
  - `totalWords` は登録単語数（`users.words_count` の counter_cache）を返す（本人スコープ・要ログイン）。マイページの表示に使う。
  - `wordbookProgresses(wordbookId)` は公式単語帳（親）の章ごとの解放状態（`WordbookProgress { id, wordbookId, completed }`）を返す。解放は進捗レコードの存在で表現し、取得時に先頭章の進捗を遅延作成（lazy initialization）する。公式でない/存在しない親は空配列。要ログイン。
- 実装済み Mutation：`signUp` / `login` / `logout` / `adminLogin`、`createWordbook` / `updateWordbook` / `deleteWordbook`、`createWord` / `updateWord` / `deleteWord`、`createAdminWordbook` / `updateAdminWordbook` / `deleteAdminWordbook`、`createAdminWord` / `updateAdminWord` / `deleteAdminWord`、`importCsv`、`addTaggedWord` / `removeTaggedWord`（冪等）/ `createStudyRecord` / `updateProfile` / `completeWordbookProgress`
  - `createAdminWord` / `updateAdminWord` / `deleteAdminWord` は公式単語帳（教材・章）の単語 CRUD。対象は「公式かつ論理削除前の単語帳に属する単語」に限定し、自作単語へ書く事故を構造的に防ぐ。`importCsv` は §3 の CSV 一括登録（行番号付きエラー・部分成功）。いずれも admin コンテキスト必須。
  - `createStudyRecord` は「日次サマリーの増分更新 + 詳細追加 + streak 更新」を 1 トランザクションで行う（§3）。
    学習日はサーバー日付（JST）。同一テストの二重送信防止はフロントの `hasPostedRef` が担う（[frontend.md](./frontend.md) §5）。
    記録の種類は GraphQL enum `StudyRecordKind`（`WORDBOOK` = 単語帳のテスト・wordbookId 必須 /
    `REVIEW` = 復習専用テスト・wordbookId 不可）で明示し、組み合わせ不正は errors で返す（消去法で復習扱いにしない）。
  - `addTaggedWord` / `removeTaggedWord` の対象は「本人の単語 or 公式単語帳の単語」（論理削除済み単語帳を除く）。
  - `updateProfile` は本人のプロフィール編集（名前は必須・パスワードは変更時のみ）。パスワード変更時は確認用との一致を検証する。
  - `completeWordbookProgress(wordbookId)` は公式単語帳の章を完了（`completed: true`）し、`order_index` 昇順で次章を `find_or_create_by!` で解放する。完了と解放を同一トランザクションで処理（§3）。
- 未実装：`studyWordbook`（`last_studied` 更新）
  - `studyWordbook` は `last_studied` を更新する任意 Mutation。現状 `last_studied` を参照する導線・受け入れ条件が無いため見送り（必要になれば `createStudyRecord` への統合含め別途）。
  （未実装のテーブルは §2 のとおり作成済み。フロントは未実装分をクライアント一時状態でフォールバック中 → [frontend.md](./frontend.md) §3）

**Mutation の返却規約**：例外を投げず `{ success, errors: [{ field, message }] }` 形式の Payload を返す。
認可失敗（本人以外・非管理者）も errors に載せる。**クエリの失敗は raise**（従来どおり GraphQL エラー）。

### Query（一般ユーザー）
| v1 REST | v2 GraphQL Query |
| --- | --- |
| `GET /me` | `me` |
| `GET /today_word` | `todayWord` |
| `GET /stats/total_words` | `totalWords` |
| `GET /wordbooks` `/wordbooks/:uuid` | `myWordbooks` / `myWordbook(id)`（自作のみ・本人スコープ） |
| `GET /wordbooks/:uuid/words` | `myWordbook.words` |
| `GET /public_wordbooks` `:uuid/children` `:uuid/words` | `publicWordbooks` / `publicWordbook(uuid){ children, words }` |
| `GET /user_word_tags` | `taggedWords` |
| `GET /study_records` `recent` `week` | `studyRecords(year,month)` / `studyRecordsRecent` / `studyRecordsWeek(startDate)` |
| `GET /user_wordbook_progresses` | `wordbookProgresses` |

### Mutation（一般ユーザー）
| v1 REST | v2 GraphQL Mutation |
| --- | --- |
| `POST /users` | `signUp` |
| `POST /login` | `login` |
| `PUT /me` | `updateProfile` |
| `POST /wordbooks` `PUT/DELETE` | `createWordbook` / `updateWordbook` / `deleteWordbook` |
| `POST /wordbooks/:uuid/words` `DELETE` | `createWord` / `updateWord` / `deleteWord`（`updateWord` は v2 追加） |
| `POST /wordbooks/:uuid/study` | `studyWordbook` |
| `POST/DELETE /user_word_tags` | `addTaggedWord` / `removeTaggedWord` |
| `POST /study_records` | `createStudyRecord` |
| `POST /user_wordbook_progresses/complete` | `completeWordbookProgress` |

### 管理者（Query / Mutation）
- `adminLogin` / `adminMe`、`adminUsers`、`adminStats`。
- `adminWordbooks` / `adminWordbook(uuid){ children, words }`。
- `createAdminWordbook` / `updateAdminWordbook` / `deleteAdminWordbook`、`createAdminWord` / `updateAdminWord` / `deleteAdminWord`、`importCsv`。

### 認可方針
- GraphQL コンテキストに `current_user` / `current_admin` を載せ、各 Resolver の冒頭でガード。
- 公式単語帳への書き込み系 Mutation は admin コンテキストでのみ実行可能とし、誤って公式へ書く事故を構造的に防ぐ（v1 の lib 分離思想を Resolver 層で再現）。
- N+1 対策として GraphQL では **DataLoader / batch loading** を導入。

## 5. 認証（DB セッション）

> v1 は JWT（ステートレス）だったが、v2 では即時失効・一元管理のしやすさから **DB セッション**へ変更した（経緯は [migration-rationale.md](./migration-rationale.md) §7）。フロント側の通信は [frontend.md](./frontend.md) §6、Codegen との関係は [graphql.md](./graphql.md) §6 を参照。

- パスワード検証は `bcrypt`（`has_secure_password`）。セッションは `activerecord-session_store`（DB 管理＝`sessions` テーブル。Solid 系と同じく Redis 不使用）。Cookie は `_memorise_session`（`same_site: :lax`、本番のみ `secure`）。
- `login` / `signUp` Mutation の成功時に `session[:user_id]` を設定し、`logout` Mutation で `reset_session`（`sessions` レコードも破棄）。**トークンは発行・返却しない**。`logout` はログイン状態に関わらず常に成功を返す冪等仕様。
- `GraphqlController` が毎リクエストで `session[:user_id]` から `User` を解決し、`role` で `current_user`（一般）/ `current_admin`（管理者）に振り分けて GraphQL コンテキストに載せる。
- ログイン失敗時はメール存在の有無を秘匿して同一メッセージ（`UNAUTHORIZED`）を返す。
- 管理者認証は `adminLogin` / `adminMe` として実装済み。`current_admin` は **単一 `users` テーブルの `role`** から解決しており、§2 の `admin_users` 別テーブル設計とどちらを採るかは未確定（要決定）。

## 6. 横断的関心事

- **CORS**：`ENV["FRONTEND_URL"]` 等を `.compact` した明示ホワイトリスト。`credentials: true`。ワイルドカード不使用。
- **ログフィルタ**：passw / email / secret / token / _key / crypt / salt / certificate / otp / ssn / cvv / cvc を除外。
- **ロケール**：`config/locales/ja.yml`。タイムゾーン JST。
- **ヘルスチェック**：`GET /up`（Kamal / LB 監視用）。
- **品質**：RuboCop（omakase）/ Brakeman / bundler-audit（導入済み）。
- **画像 / メール**（未導入・予定）：Active Storage + image_processing（S3）、SES v2（メール）。
- **デプロイ**（未導入・予定）：Kamal（`.kamal/` + `config/deploy.yml`）。

## 7. v1 → v2 移行で注意する点

- REST の「動詞エンドポイント」（`/wordbooks/:uuid/study`）は GraphQL Mutation（`studyWordbook`）に自然に移せる。
- v1 の「公式／自作で lib を分離」していた事故防止は、v2 では Resolver 認可 + 型分離で担保する。
- counter_cache / 論理削除 / ユニーク制約 / トランザクションといった **DB・モデル層の防御は API 方式に依存しないため、そのまま維持**する。
