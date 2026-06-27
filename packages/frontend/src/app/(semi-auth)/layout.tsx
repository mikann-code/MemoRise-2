import type { ReactNode } from "react";
import Layout from "@/components/layout/Layout";

/**
 * (semi-auth) グループ：一部開放。
 * 公式単語帳一覧などは未ログインでも閲覧でき、/my-page 等の一部のみ各ページ側でガードする。
 * グループ全体での強制リダイレクトは行わない（docs/frontend.md「1. ルーティング設計」）。
 */
export default function SemiAuthLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
