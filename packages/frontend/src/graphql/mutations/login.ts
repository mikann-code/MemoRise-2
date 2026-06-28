"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { LoginMutationVariables } from "@/gql/graphql";

/**
 * ログイン Mutation。
 * 認証は DB セッション方式のため、レスポンスにトークンは含まず、
 * 成否はサーバーが付与するセッション Cookie（_memorise_session）で表現される。
 */
export const LoginDocument = graphql(`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        name
        email
        role
        streak
        wordsCount
      }
    }
  }
`);

export type { LoginMutationVariables };

/** useMutation(LoginDocument) の薄いラッパー（型は Document から自動推論）。 */
export function useLoginMutation() {
  return useMutation(LoginDocument);
}
