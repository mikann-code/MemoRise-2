import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Codegen 設定（client-preset）。
 * スキーマはコミット済み SDL を参照する（backend の `bin/rails graphql:schema:dump`
 * が出力する packages/backend/schema.graphql）。backend を起動していなくても・CI でも
 * 生成できるのが狙い。backend の GraphQL を変えたら schema.graphql を再ダンプ＆コミットする。
 *
 *   npm run codegen
 *
 * 出力 src/gql/ は .gitignore 対象。コミットせず、postinstall / predev で自動生成する。
 * 各オペレーションは src/graphql 配下で graphql() タグに書き、型付き Document を得る。
 */
const config: CodegenConfig = {
  schema: "../backend/schema.graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/gql/**"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      // fragment masking は使わないので無効化（結果型をそのまま参照できる）。
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
