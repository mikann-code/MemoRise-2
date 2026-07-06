"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { DeleteAdminWordbookMutationVariables } from "@/gql/graphql";

/** 公式単語帳の削除（管理者専用・論理削除）。 */
export const DeleteAdminWordbookDocument = graphql(`
  mutation DeleteAdminWordbook($id: ID!) {
    deleteAdminWordbook(id: $id) {
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

export type { DeleteAdminWordbookMutationVariables };

export function useDeleteAdminWordbookMutation() {
  return useMutation(DeleteAdminWordbookDocument);
}
