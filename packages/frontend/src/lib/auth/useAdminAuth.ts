"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import {
  useAdminLoginMutation,
  type AdminLoginMutationVariables,
} from "@/graphql/mutations/adminLogin";
import { useLogoutMutation } from "@/graphql/mutations/logout";

/**
 * 管理者の認証アクション（ログイン / ログアウト）。
 * 一般ユーザーとはスコープを分離し、管理者用 Apollo Client 上で動く。
 * ログアウトは一般と同じ logout Mutation（セッション破棄・冪等・スコープ非依存）を共用する。
 */
export function useAdminAuth() {
  const router = useRouter();
  const client = useApolloClient();
  const [adminLoginMutation, adminLoginState] = useAdminLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const adminLogin = useCallback(
    async (vars: AdminLoginMutationVariables): Promise<boolean> => {
      try {
        await adminLoginMutation({ variables: vars });
      } catch {
        return false; // 失敗内容は adminLoginState.error に入る
      }
      // 新しいセッションで adminMe を引き直すためキャッシュをリセットして管理者トップへ。
      await client.resetStore();
      router.replace("/admin");
      return true;
    },
    [adminLoginMutation, client, router],
  );

  const adminLogout = useCallback(async (): Promise<void> => {
    try {
      await logoutMutation();
    } finally {
      // ログアウトは冪等。失敗時もローカルのキャッシュは必ず捨てて管理者ログイン画面へ。
      await client.clearStore();
      router.replace("/admin-login");
      router.refresh();
    }
  }, [logoutMutation, client, router]);

  return {
    adminLogin,
    adminLogout,
    adminLoginError: adminLoginState.error,
    submitting: adminLoginState.loading,
  };
}
