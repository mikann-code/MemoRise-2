"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { UpdateWordMutationVariables } from "@/gql/graphql";

/** 単語の更新（本人のみ）。 */
export const UpdateWordDocument = graphql(`
  mutation UpdateWord($id: ID!, $question: String, $answer: String) {
    updateWord(id: $id, question: $question, answer: $answer) {
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

export type { UpdateWordMutationVariables };

export function useUpdateWordMutation() {
  return useMutation(UpdateWordDocument);
}
