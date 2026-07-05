"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { TaggedWordsQuery } from "@/gql/graphql";

/** 復習タグ付きの単語一覧（本人のみ・タグ付けの新しい順・要ログイン）。 */
export const TaggedWordsDocument = graphql(`
  query TaggedWords {
    taggedWords {
      id
      question
      answer
    }
  }
`);

export type { TaggedWordsQuery };

/**
 * useQuery(TaggedWordsDocument) の薄いラッパー。
 * タグの付け外しで頻繁に変わるリストなので cache-and-network（docs/frontend.md §7）。
 */
export function useTaggedWordsQuery() {
  return useQuery(TaggedWordsDocument, { fetchPolicy: "cache-and-network" });
}
