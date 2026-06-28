import type { ReactNode } from "react";
import AdminAuthProvider from "@/components/feature/AdminAuthProvider";

/**
 * /admin/* の管理者セグメント。
 * AdminAuthProvider が adminMe を引いて role=admin を検証し、
 * 管理者でなければ（role 不一致・未認証とも）/admin-login へリダイレクトする。
 * /admin-login 自体は (admin-user) グループ直下でこのガードの外にある。
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
