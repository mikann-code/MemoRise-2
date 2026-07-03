import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // モノレポで package-lock.json がルートと packages/frontend の 2 か所にあり、
    // Turbopack がワークスペースルートを推測して警告を出す。依存は npm workspaces の
    // ホイストでモノレポルート(node_modules)に入るため、root をそこへ明示して警告を止める。
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
