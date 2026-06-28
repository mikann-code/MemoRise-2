"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { SignUpMutationVariables } from "@/gql/graphql";

/**
 * 新規登録 Mutation。
 * 認証は DB セッション方式のため、レスポンスにトークンは含まず、
 * 成否はサーバーが付与するセッション Cookie（_memorise_session）で表現される。
 */
export const SignUpDocument = graphql(`
  mutation SignUp($name: String!, $email: String!, $password: String!) {
    signUp(name: $name, email: $email, password: $password) {
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

export type { SignUpMutationVariables };

/** useMutation(SignUpDocument) の薄いラッパー（型は Document から自動推論）。 */
export function useSignUpMutation() {
  return useMutation(SignUpDocument);
}
