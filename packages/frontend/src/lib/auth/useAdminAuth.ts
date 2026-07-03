"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import {
  useAdminLoginMutation,
  type AdminLoginMutationVariables,
} from "@/graphql/mutations/adminLogin";
import { useLogoutMutation } from "@/graphql/mutations/logout";
import type { AuthFieldError } from "@/lib/auth/authError";

// 想定外（通信断・GraphQL 例外など）で errors ペイロードが取れないときの汎用エラー。
const systemError = (message: string): AuthFieldError[] => [{ field: "system", message }];

/**
 * 管理者の認証アクション（ログイン / ログアウト）。
 * 一般ユーザーとはスコープを分離し、管理者用 Apollo Client 上で動く。
 * 成否は例外ではなく mutation の {success, errors} ペイロードで判定し、失敗時は errors を state に保持する。
 * ログアウトは一般と同じ logout Mutation（セッション破棄・冪等・スコープ非依存）を共用する。
 */
export function useAdminAuth() {
  const router = useRouter();
  const client = useApolloClient();
  const [adminLoginMutation, adminLoginState] = useAdminLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const [adminLoginErrors, setAdminLoginErrors] = useState<AuthFieldError[]>([]);

  const adminLogin = useCallback(
    async (vars: AdminLoginMutationVariables): Promise<boolean> => {
      setAdminLoginErrors([]);
      try {
        const { data } = await adminLoginMutation({ variables: vars });
        const payload = data?.adminLogin;
        if (!payload?.success) {
          const errors = payload?.errors ?? [];
          setAdminLoginErrors(
            errors.length
              ? errors.map(({ field, message }) => ({ field, message }))
              : systemError("ログインに失敗しました"),
          );
          return false;
        }
      } catch {
        setAdminLoginErrors(systemError("ログインに失敗しました"));
        return false;
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
    adminLoginErrors,
    submitting: adminLoginState.loading,
  };
}
