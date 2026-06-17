import next from "eslint-config-next/core-web-vitals";

// Next.js 16 の eslint-config-next はフラットコンフィグ配列を直接エクスポートする。
// （次の typescript 設定も core-web-vitals 側に含まれる）
const eslintConfig = [
  ...next,
  {
    ignores: ["src/gql/**", ".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
