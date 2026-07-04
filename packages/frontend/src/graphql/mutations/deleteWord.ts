"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { DeleteWordMutationVariables } from "@/gql/graphql";

/** 単語の削除（本人のみ・物理削除）。 */
export const DeleteWordDocument = graphql(`
  mutation DeleteWord($id: ID!) {
    deleteWord(id: $id) {
      success
      errors {
        field
        message
      }
      word {
        id
      }
    }
  }
`);

export type { DeleteWordMutationVariables };

export function useDeleteWordMutation() {
  return useMutation(DeleteWordDocument);
}
