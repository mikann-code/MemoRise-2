"use client";

import { createContext, useContext } from "react";
import type { MeQuery } from "@/graphql/queries/me";

// currentUser の型は codegen 生成の Me クエリ結果型から導出する（me が非 null の場合の User）。
type CurrentUser = NonNullable<MeQuery["me"]>;

interface AuthContextValue {
  /** ログイン中のユーザー情報（AuthProvider 配下では必ず存在する） */
  currentUser: CurrentUser;
  /** currentUser を API から再取得する（プロフィール更新後などに呼ぶ） */
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 認証済みユーザー情報を取得する hook。
 * (auth)/layout.tsx の AuthProvider 配下でのみ使用可能。
 * 認証アクション（signUp/login/logout）が必要な場合は useAuth を使う。
 */
export function useCurrentUser(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useCurrentUser は AuthProvider の内部で使用してください");
  }
  return context;
}

export { AuthContext };
export type { CurrentUser };
