"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { MeQuery, MeQueryVariables } from "@/gql/graphql";

/** 現在のセッションのユーザーを取得する Query。未ログイン時は null。 */
export const MeDocument = graphql(`
  query Me {
    me {
      id
      name
      email
      role
      streak
      wordsCount
    }
  }
`);

export type { MeQuery };

/** useQuery(MeDocument) の薄いラッパー（fetchPolicy 等のオプションはそのまま渡せる）。 */
export function useMeQuery(
  options?: Parameters<typeof useQuery<MeQuery, MeQueryVariables>>[1],
) {
  return useQuery(MeDocument, options);
}
