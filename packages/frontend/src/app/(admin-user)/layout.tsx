import type { ReactNode } from "react";
import AdminApolloProvider from "./AdminApolloProvider";

/**
 * (admin-user) グループ：管理者空間（/admin-login, /admin/*）。
 * 配下を管理者用 Apollo Client（admin_token・別キャッシュ）に差し替える。
 *
 * /admin-login もこのグループ配下のため、ここでは強制リダイレクトしない。
 * 管理者ガードは /admin/* に効く (admin-user)/admin/layout.tsx に集約する。
 */
export default function AdminUserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminApolloProvider>{children}</AdminApolloProvider>;
}
