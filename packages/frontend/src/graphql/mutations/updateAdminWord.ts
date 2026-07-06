"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { UpdateAdminWordMutationVariables } from "@/gql/graphql";

/** 公式単語帳の単語の更新（管理者専用）。 */
export const UpdateAdminWordDocument = graphql(`
  mutation UpdateAdminWord($id: ID!, $question: String, $answer: String) {
    updateAdminWord(id: $id, question: $question, answer: $answer) {
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

export type { UpdateAdminWordMutationVariables };

export function useUpdateAdminWordMutation() {
  return useMutation(UpdateAdminWordDocument);
}
