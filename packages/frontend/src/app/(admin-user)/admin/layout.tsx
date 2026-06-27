import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/serverAuth";

/**
 * /admin/* の管理者ガード。未ログイン（または非管理者）なら /admin-login へ。
 * NOTE: role 整合の本検証は adminMe クエリ実装時（認証 Issue #5 / #6）に差し替える。
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
