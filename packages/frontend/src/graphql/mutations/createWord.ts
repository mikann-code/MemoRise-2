"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CreateWordMutationVariables } from "@/gql/graphql";

/** 自作単語帳への単語の追加（本人のみ）。 */
export const CreateWordDocument = graphql(`
  mutation CreateWord($wordbookId: ID!, $question: String!, $answer: String!) {
    createWord(wordbookId: $wordbookId, question: $question, answer: $answer) {
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

export type { CreateWordMutationVariables };

export function useCreateWordMutation() {
  return useMutation(CreateWordDocument);
}
