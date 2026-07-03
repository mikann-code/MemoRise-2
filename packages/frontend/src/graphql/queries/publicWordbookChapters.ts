"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type {
  PublicWordbookChaptersQuery,
  PublicWordbookChaptersQueryVariables,
} from "@/gql/graphql";

/**
 * 公式単語帳の親 1 件を、子（章）＋各章の単語まで辿って取得する（読み取り専用・要ログイン）。
 * 章 1 件の単語を引きたいが、公式クエリ（publicWordbook）は親（parent_id: nil）しか返さないため、
 * 親を引いて children から該当章をクライアントで選び出す方式にしている。list / test ページで使う。
 * NOTE: 親配下の全章の単語を取得するので取り過ぎ気味。章単体の resolver は後続で用意したい。
 */
export const PublicWordbookChaptersDocument = graphql(`
  query PublicWordbookChapters($id: ID!) {
    publicWordbook(id: $id) {
      id
      title
      children {
        id
        title
        part
        description
        wordsCount
        words {
          id
          question
          answer
        }
      }
    }
  }
`);

export type { PublicWordbookChaptersQuery };

/** useQuery(PublicWordbookChaptersDocument) の薄いラッパー（id 必須なので variables を渡す）。 */
export function usePublicWordbookChaptersQuery(
  options: Parameters<
    typeof useQuery<
      PublicWordbookChaptersQuery,
      PublicWordbookChaptersQueryVariables
    >
  >[1],
) {
  return useQuery(PublicWordbookChaptersDocument, options);
}
