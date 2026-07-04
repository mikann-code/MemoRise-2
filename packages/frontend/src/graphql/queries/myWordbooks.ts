"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { MyWordbooksQuery } from "@/gql/graphql";

/** 自作単語帳の一覧（本人の personal のみ・要ログイン）。 */
export const MyWordbooksDocument = graphql(`
  query MyWordbooks {
    myWordbooks {
      id
      title
      description
      label
      wordsCount
      lastStudied
    }
  }
`);

export type { MyWordbooksQuery };

/**
 * useQuery(MyWordbooksDocument) の薄いラッパー。
 * 作成・削除後に一覧へ戻ったとき古いキャッシュを出さないよう cache-and-network。
 */
export function useMyWordbooksQuery() {
  return useQuery(MyWordbooksDocument, { fetchPolicy: "cache-and-network" });
}
