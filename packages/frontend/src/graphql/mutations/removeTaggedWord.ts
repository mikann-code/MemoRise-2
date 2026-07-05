"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { RemoveTaggedWordMutationVariables } from "@/gql/graphql";

/** 単語の復習タグを外す（本人のタグのみ。タグが無くても成功する冪等仕様）。 */
export const RemoveTaggedWordDocument = graphql(`
  mutation RemoveTaggedWord($wordId: ID!) {
    removeTaggedWord(wordId: $wordId) {
      success
      errors {
        field
        message
      }
    }
  }
`);

export type { RemoveTaggedWordMutationVariables };

export function useRemoveTaggedWordMutation() {
  return useMutation(RemoveTaggedWordDocument);
}
