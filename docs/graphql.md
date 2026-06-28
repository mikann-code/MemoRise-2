# GraphQL 開発フロー（MemoRise v2）

> バックエンド（graphql-ruby）で定義したスキーマを**単一の真実**とし、フロントは GraphQL Codegen で型を自動生成する。本書は「日々どう書き、API を増やすとき何をするか」の**運用手順**をまとめたもの。
> スキーマの設計内容（どの Query/Mutation があるか）は [backend.md](./backend.md) §4、Apollo / 画面側の使い方は [frontend.md](./frontend.md) §6-7 を参照。

## 1. 全体像（バック↔フロントの契約）

```
① バックエンド（Ruby・手書き）
   app/graphql/ で 型 / Mutation / Query を定義
        │  bin/rails graphql:schema:dump
        ▼
② packages/backend/schema.graphql（SDL・コミット）   ← 契約 = 単一の真実
        │  codegen が読む
        │     ＋ ③ フロントのクエリ（src/graphql の graphql(`...`)・手書き）も読む
        ▼
④ packages/frontend/src/gql/（codegen が自動生成：型 + graphql() 関数）  ← gitignore・非コミット
        │  import
        ▼
⑤ src/graphql のフック（useLoginMutation 等）→ 画面が使用
```

codegen は **②schema.graphql（契約）** と **③あなたが書いたクエリ** の2つを突き合わせて **④型** を出力する。

## 2. 手書き / 自動生成の責務

| レイヤー | 手書き | 自動生成 |
| --- | --- | --- |
| バックエンド・スキーマ | 型 / Mutation / Query 定義（`app/graphql/**`） | — |
| 契約 | — | `schema.graphql`（`graphql:schema:dump`） |
| フロント・クエリ | `graphql(`...`)`（どのフィールドが欲しいか）＋薄いフックラッパー | — |
| フロント・型 | — | `src/gql/`（codegen / client-preset） |

**手書きするのは2か所だけ**（①バックのスキーマ定義、③フロントのクエリ）。`schema.graphql` と `src/gql` はどちらも生成物。

## 3. ディレクトリの役割

| パス | 中身 | 生成？ | git |
| --- | --- | --- | --- |
| `packages/backend/app/graphql/` | スキーマ定義（types / mutations / query_type …） | 手書き | コミット |
| `packages/backend/schema.graphql` | SDL（契約） | `graphql:schema:dump` で生成 | **コミット** |
| `packages/frontend/src/graphql/` | `graphql()` ドキュメント ＋ `useXxx` ラッパー | 手書き | コミット |
| `packages/frontend/src/gql/` | 型 ＋ 型付き `graphql()` 関数 | codegen で生成 | **gitignore（非コミット）** |

> ⚠️ `graphql/`（手書き入力）と `gql/`（生成出力）は名前がそっくりだが**別物**。`src/gql/` は **触らない・コミットしない**（毎回再生成される）。

## 4. 新しい API を1つ追加する手順（チェックリスト）

例：`todayWord` クエリを追加する場合。

1. **［バック・手書き］** `app/graphql/` に型 / Query / Mutation を追加（resolver 含む）。
2. **［バック・コマンド］** スキーマを再ダンプしてコミット:
   ```bash
   cd packages/backend && bin/rails graphql:schema:dump   # schema.graphql / schema.json を出力
   ```
3. **［フロント・手書き］** `src/graphql/{queries,mutations}/` にクエリを追加:
   ```ts
   // src/graphql/queries/todayWord.ts
   "use client";
   import { useQuery } from "@apollo/client/react";
   import { graphql } from "@/gql";

   export const TodayWordDocument = graphql(`
     query TodayWord { todayWord { id question answer } }
   `);

   export function useTodayWordQuery() {
     return useQuery(TodayWordDocument);
   }
   ```
4. **［自動］** codegen が型を生成（`npm run codegen`、または dev/build/CI で自動）。
5. 画面から `useTodayWordQuery()` を使う。結果・変数の型はすべて効く。

> 新規オペレーションを**初めて**足したときは、`graphql()` が型付き Document を返すために**一度 codegen を回す**必要がある（オーバーロードが生成されるまで戻り値は汎用型）。

## 5. codegen の実行タイミング

- 手動: `npm run codegen`
- 自動（`packages/frontend/package.json` の lifecycle scripts）:
  - `postinstall` … `npm ci` / `npm install` の後（**CI の lint/build/e2e はこれで生成済みになる**）
  - `predev` … `npm run dev` の前
  - `prebuild` … `npm run build` の前

スキーマ参照は**コミット済み `../backend/schema.graphql`**（[codegen.ts](../packages/frontend/codegen.ts)）。backend 起動も DB も不要・オフラインでも生成できる。CI（[.github/workflows/ci.yml](../.github/workflows/ci.yml)）は `npm ci` の `postinstall` で生成されるため、**ci.yml に codegen 専用ステップは無い**。

## 6. 認証との関係

認証は **DB セッション方式**（Cookie `_memorise_session`）。詳細は [backend.md](./backend.md) §5 / [frontend.md](./frontend.md) §6。

- Apollo の HttpLink は `credentials: "include"` でセッション Cookie を毎リクエスト送る（[apolloClient.ts](../packages/frontend/src/lib/apolloClient.ts)）。**トークンを手で付ける処理は無い**ので、オペレーション側に認証用の引数や header は書かない。
- ログイン状態は `me` クエリの結果で判定する（Cookie はクロスオリジンで Next サーバーから読めないため）。

## 7. よくある落とし穴

- **`schema.graphql` のダンプ忘れ** … バックの GraphQL を変えたのに `graphql:schema:dump` を回さないと、フロントの型が古いまま。新フィールドが「存在しない」と codegen に怒られたら大体これ。
- **`src/gql/` を編集・コミットしてしまう** … 生成物なので編集は無駄になり、コミットは禁止（gitignore 済み）。
- **`graphql` と `gql` の取り違え** … `@/graphql/...`（手書き）と `@/gql`（生成）。import 元を間違えやすい。
- **Apollo v4 の import** … React 用フック（`useQuery` / `useMutation`）は `@apollo/client` ではなく **`@apollo/client/react`** から。`gql` / `ApolloClient` などコアは `@apollo/client`。
- **codegen 未実行で `@/gql` が無い** … クローン直後に `@/gql` 解決エラーが出たら、`npm install`（postinstall）か `npm run codegen` を一度回す。

## 8. 補足（設計判断）

- フックは codegen が生成するのではなく、**`useMutation(Document)` を包む1行ラッパーを手書き**している。Apollo Client **v4** では `typescript-react-apollo`（フック自動生成プラグイン）が公式サポート外のため、v4 公式推奨の **client-preset** で型付き Document を生成し、`useLoginMutation()` のような名前付きフックの使い心地だけラッパーで補う方針にしている。
- `schema.graphql` は手書きせず必ず `graphql:schema:dump` で生成する。バック↔フロントをつなぐ**唯一の手作業の節目**がこのダンプ＆コミット。
