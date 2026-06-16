import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Codegen 設定。
 * バックエンドの GraphQL スキーマからフロントエンドの型・フックを自動生成する。
 *
 *   npm run codegen
 *
 * バックエンド（http://localhost:3100/graphql）を起動した状態で実行する。
 */
const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3100/graphql",
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
    },
  },
};

export default config;
