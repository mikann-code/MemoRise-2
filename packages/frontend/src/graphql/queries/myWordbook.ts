"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { MyWordbookQuery, MyWordbookQueryVariables } from "@/gql/graphql";

/** 自作単語帳 1 件（単語まで。本人以外・公式・論理削除済みは null）。 */
export const MyWordbookDocument = graphql(`
  query MyWordbook($id: ID!) {
    myWordbook(id: $id) {
      id
      title
      description
      label
      wordsCount
      words {
        id
        question
        answer
      }
    }
  }
`);

export type { MyWordbookQuery };

/**
 * useQuery(MyWordbookDocument) の薄いラッパー（id 必須なので variables を渡す）。
 * 単語の追加・削除後に古いキャッシュを出さないよう、呼び出し側で
 * fetchPolicy: "cache-and-network" を併せて渡す。
 */
export function useMyWordbookQuery(
  options: Parameters<
    typeof useQuery<MyWordbookQuery, MyWordbookQueryVariables>
  >[1],
) {
  return useQuery(MyWordbookDocument, options);
}
