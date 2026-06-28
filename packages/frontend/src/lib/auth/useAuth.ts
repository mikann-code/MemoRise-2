"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { useSignUpMutation, type SignUpMutationVariables } from "@/graphql/mutations/signUp";
import { useLoginMutation, type LoginMutationVariables } from "@/graphql/mutations/login";
import { useLogoutMutation } from "@/graphql/mutations/logout";

/**
 * 一般ユーザーの認証アクション（サインアップ / ログイン / ログアウト）。
 * 認証は DB セッション方式のため、成功時はサーバーがセッション Cookie を発行・破棄する。
 * クライアント側は Apollo キャッシュをリセットして me を引き直し、画面遷移するだけでよい。
 */
export function useAuth() {
  const router = useRouter();
  const client = useApolloClient();
  const [signUpMutation, signUpState] = useSignUpMutation();
  const [loginMutation, loginState] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  // 認証成功後、新しいセッションで me を引き直すためキャッシュをリセットしてホームへ。
  const enterApp = useCallback(async () => {
    await client.resetStore();
    router.replace("/");
  }, [client, router]);

  const signUp = useCallback(
    async (vars: SignUpMutationVariables): Promise<boolean> => {
      try {
        await signUpMutation({ variables: vars });
      } catch {
        return false; // 失敗内容は signUpState.error に入る
      }
      await enterApp();
      return true;
    },
    [signUpMutation, enterApp],
  );

  const login = useCallback(
    async (vars: LoginMutationVariables): Promise<boolean> => {
      try {
        await loginMutation({ variables: vars });
      } catch {
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
    signUpError: signUpState.error,
    loginError: loginState.error,
    submitting: signUpState.loading || loginState.loading,
  };
}
