"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminLoginMutationVariables } from "@/gql/graphql";

/**
 * 管理者ログイン Mutation。
 * 一般ユーザーとはスコープを分離し、管理者用 Apollo Client（別キャッシュ空間）で実行する。
 * 認証は DB セッション方式のため、レスポンスにトークンは含まず、
 * 成否はサーバーが付与するセッション Cookie（_memorise_session）で表現される。
 */
export const AdminLoginDocument = graphql(`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      user {
        id
        name
        email
        role
      }
    }
  }
`);

export type { AdminLoginMutationVariables };

/** useMutation(AdminLoginDocument) の薄いラッパー（型は Document から自動推論）。 */
export function useAdminLoginMutation() {
  return useMutation(AdminLoginDocument);
}
