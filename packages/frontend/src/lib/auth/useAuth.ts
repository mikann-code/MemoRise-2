"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { useSignUpMutation, type SignUpMutationVariables } from "@/graphql/mutations/signUp";
import { useLoginMutation, type LoginMutationVariables } from "@/graphql/mutations/login";
import { useLogoutMutation } from "@/graphql/mutations/logout";
import type { AuthFieldError } from "@/lib/auth/authError";

// 想定外（通信断・GraphQL 例外など）で errors ペイロードが取れないときの汎用エラー。
const systemError = (message: string): AuthFieldError[] => [{ field: "system", message }];

/**
 * 一般ユーザーの認証アクション（サインアップ / ログイン / ログアウト）。
 * 認証は DB セッション方式。成否は例外ではなく mutation の {success, errors} ペイロードで判定し、
 * 失敗時は errors（field 単位）を state に保持して画面へ渡す。
 * 成功時はサーバーがセッション Cookie を発行・破棄するので、Apollo キャッシュをリセットして遷移する。
 */
export function useAuth() {
  const router = useRouter();
  const client = useApolloClient();
  const [signUpMutation, signUpState] = useSignUpMutation();
  const [loginMutation, loginState] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const [signUpErrors, setSignUpErrors] = useState<AuthFieldError[]>([]);
  const [loginErrors, setLoginErrors] = useState<AuthFieldError[]>([]);

  // 認証成功後、新しいセッションで me を引き直すためキャッシュをリセットしてホームへ。
  const enterApp = useCallback(async () => {
    await client.resetStore();
    router.replace("/");
  }, [client, router]);

  const signUp = useCallback(
    async (vars: SignUpMutationVariables): Promise<boolean> => {
      setSignUpErrors([]);
      try {
        const { data } = await signUpMutation({ variables: vars });
        const payload = data?.signUp;
        if (!payload?.success) {
          const errors = payload?.errors ?? [];
          setSignUpErrors(
            errors.length
              ? errors.map(({ field, message }) => ({ field, message }))
              : systemError("登録に失敗しました"),
          );
          return false;
        }
      } catch {
        setSignUpErrors(systemError("登録に失敗しました"));
        return false;
      }
      await enterApp();
      return true;
    },
    [signUpMutation, enterApp],
  );

  const login = useCallback(
    async (vars: LoginMutationVariables): Promise<boolean> => {
      setLoginErrors([]);
      try {
        const { data } = await loginMutation({ variables: vars });
        const payload = data?.login;
        if (!payload?.success) {
          const errors = payload?.errors ?? [];
          setLoginErrors(
            errors.length
              ? errors.map(({ field, message }) => ({ field, message }))
              : systemError("ログインに失敗しました"),
          );
          return false;
        }
      } catch {
        setLoginErrors(systemError("ログインに失敗しました"));
        return false;
      }
      await enterApp();
      return true;
    },
    [loginMutation, enterApp],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutMutation();
    } finally {
      // ログアウトは冪等。失敗時もローカルのキャッシュは必ず捨ててログイン画面へ。
      await client.clearStore();
      router.replace("/login");
      router.refresh();
    }
  }, [logoutMutation, client, router]);

  return {
    signUp,
    login,
    logout,
    signUpErrors,
    loginErrors,
    submitting: signUpState.loading || loginState.loading,
  };
}
