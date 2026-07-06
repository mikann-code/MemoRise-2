"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { DeleteAdminWordMutationVariables } from "@/gql/graphql";

/** 公式単語帳の単語の削除（管理者専用・物理削除）。 */
export const DeleteAdminWordDocument = graphql(`
  mutation DeleteAdminWord($id: ID!) {
    deleteAdminWord(id: $id) {
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

export type { DeleteAdminWordMutationVariables };

export function useDeleteAdminWordMutation() {
  return useMutation(DeleteAdminWordDocument);
}
