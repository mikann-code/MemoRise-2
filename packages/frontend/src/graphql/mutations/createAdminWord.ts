"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CreateAdminWordMutationVariables } from "@/gql/graphql";

/** 公式単語帳への単語の追加（管理者専用）。 */
export const CreateAdminWordDocument = graphql(`
  mutation CreateAdminWord($wordbookId: ID!, $question: String!, $answer: String!) {
    createAdminWord(wordbookId: $wordbookId, question: $question, answer: $answer) {
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

export type { CreateAdminWordMutationVariables };

export function useCreateAdminWordMutation() {
  return useMutation(CreateAdminWordDocument);
}
