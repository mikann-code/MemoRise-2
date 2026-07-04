"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { DeleteWordbookMutationVariables } from "@/gql/graphql";

/** 自作単語帳の削除（本人のみ・論理削除）。 */
export const DeleteWordbookDocument = graphql(`
  mutation DeleteWordbook($id: ID!) {
    deleteWordbook(id: $id) {
      success
      errors {
        field
        message
      }
      wordbook {
        id
      }
    }
  }
`);

export type { DeleteWordbookMutationVariables };

export function useDeleteWordbookMutation() {
  return useMutation(DeleteWordbookDocument);
}
