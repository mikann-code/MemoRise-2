"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type {
  PublicWordbooksQuery,
  PublicWordbooksQueryVariables,
} from "@/gql/graphql";

/** 公式単語帳の親一覧（読み取り専用・要ログイン）。 */
export const PublicWordbooksDocument = graphql(`
  query PublicWordbooks {
    publicWordbooks {
      id
      title
      label
      level
    }
  }
`);

export type { PublicWordbooksQuery };

/** useQuery(PublicWordbooksDocument) の薄いラッパー。 */
export function usePublicWordbooksQuery(
  options?: Parameters<
    typeof useQuery<PublicWordbooksQuery, PublicWordbooksQueryVariables>
  >[1],
) {
  return useQuery(PublicWordbooksDocument, options);
}
