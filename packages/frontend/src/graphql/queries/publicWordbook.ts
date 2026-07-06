"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type {
  PublicWordbookQuery,
  PublicWordbookQueryVariables,
} from "@/gql/graphql";

/** 公式単語帳の親 1 件（子＝章まで。読み取り専用・要ログイン）。 */
export const PublicWordbookDocument = graphql(`
  query PublicWordbook($id: ID!) {
    publicWordbook(id: $id) {
      id
      title
      label
      level
      children {
        id
        title
        wordsCount
      }
    }
  }
`);

export type { PublicWordbookQuery };

/** useQuery(PublicWordbookDocument) の薄いラッパー（id 必須なので variables を渡す）。 */
export function usePublicWordbookQuery(
  options: Parameters<
    typeof useQuery<PublicWordbookQuery, PublicWordbookQueryVariables>
  >[1],
) {
  return useQuery(PublicWordbookDocument, options);
}
