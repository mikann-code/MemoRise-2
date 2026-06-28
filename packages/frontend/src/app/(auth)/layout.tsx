import type { ReactNode } from "react";
import Layout from "@/components/layout/Layout";
import AuthProvider from "@/components/feature/AuthProvider";

/**
 * (auth) グループ：ログイン必須（/wordbooks, /study-records 等）。
 * DB セッション Cookie は Next サーバーからは読めないため、ガードはクライアントの
 * AuthProvider（me クエリ）に集約する。未認証なら /login へリダイレクトし、
 * 認証済みのときだけ currentUser を Context に載せて配下へ配る。
 * AuthProvider で Layout 全体を包むので、Header も自前で me を引かず
 * useCurrentUser で Context から読む（me の取得をこの 1 クエリに集約する）。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}
