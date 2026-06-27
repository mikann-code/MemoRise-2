import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/serverAuth";
import Layout from "@/components/layout/Layout";

/**
 * (auth) グループ：ログイン必須（/wordbooks, /study-records 等）。
 * 未ログインなら /login へリダイレクト（認証ガードをグループに集約）。
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();
  return <Layout>{children}</Layout>;
}
