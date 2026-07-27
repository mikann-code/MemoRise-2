import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// モノレポで package-lock.json がルートと packages/frontend の 2 か所にあり、
// Turbopack がワークスペースルートを推測して警告を出す。依存は npm workspaces の
// ホイストでモノレポルート(node_modules)に入るため、root をそこへ明示して警告を止める。
// ただし Docker の frontend コンテナは packages/frontend だけを /app にマウントするので
// 2 つ上は "/" になり、Turbopack がファイルシステム全体を走査して深い動的ルートを
// 取りこぼす（/publicWordbooks/[parentId]/[childrenId]/list が 404 になる）。
// モノレポルートに package.json が無い＝単体マウントとみなし、frontend 自身を root にする。
const monorepoRoot = path.join(__dirname, "..", "..");
const turbopackRoot = fs.existsSync(path.join(monorepoRoot, "package.json"))
  ? monorepoRoot
  : __dirname;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: turbopackRoot,
  },
  // 本番は FE（Vercel）と BE（Render）が別ドメインで、セッション Cookie が
  // サードパーティ扱いになり WebKit（iPhone 全ブラウザ）の ITP にブロックされる。
  // /graphql を同一オリジンで受けてサーバー側で BE へ転送し、Cookie を
  // ファーストパーティ化する（#39）。BACKEND_GRAPHQL_URL 未設定（ローカル開発・
  // E2E）では rewrite せず、従来どおり NEXT_PUBLIC_GRAPHQL_URL で直接 BE へ向ける。
  async rewrites() {
    const backend = process.env.BACKEND_GRAPHQL_URL;
    if (!backend) return [];
    return [{ source: "/graphql", destination: backend }];
  },
};

export default nextConfig;
