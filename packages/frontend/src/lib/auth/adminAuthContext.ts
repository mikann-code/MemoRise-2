"use client";

import { createContext, useContext } from "react";
import type { AdminMeQuery } from "@/graphql/queries/adminMe";

// currentAdmin の型は codegen 生成の AdminMe クエリ結果型から導出する（adminMe が非 null の場合）。
type CurrentAdmin = NonNullable<AdminMeQuery["adminMe"]>;

interface AdminAuthContextValue {
  /** ログイン中の管理者情報（AdminAuthProvider 配下では必ず存在する） */
  currentAdmin: CurrentAdmin;
  /** currentAdmin を API から再取得する */
  refetch: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * 認証済み管理者情報を取得する hook。
 * (admin-user)/admin/layout.tsx の AdminAuthProvider 配下でのみ使用可能。
 * 認証アクション（adminLogin/adminLogout）が必要な場合は useAdminAuth を使う。
 */
export function useCurrentAdmin(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useCurrentAdmin は AdminAuthProvider の内部で使用してください");
  }
  return context;
}

export { AdminAuthContext };
export type { CurrentAdmin };
