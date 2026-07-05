"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AddTaggedWordMutationVariables } from "@/gql/graphql";

/** 単語へ復習タグを付ける（本人の単語・公式の単語。タグ済みでも成功する冪等仕様）。 */
export const AddTaggedWordDocument = graphql(`
  mutation AddTaggedWord($wordId: ID!) {
    addTaggedWord(wordId: $wordId) {
      success
      errors {
        field
        message
      }
      word {
        id
        question
        answer
      }
    }
  }
`);

export type { AddTaggedWordMutationVariables };

export function useAddTaggedWordMutation() {
  return useMutation(AddTaggedWordDocument);
}
