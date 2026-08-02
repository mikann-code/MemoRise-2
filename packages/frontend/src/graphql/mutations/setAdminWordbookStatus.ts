"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { SetAdminWordbookStatusMutationVariables } from "@/gql/graphql";

/** 教材の公開状態の切り替え（管理者専用。章へ伝播）。 */
export const SetAdminWordbookStatusDocument = graphql(`
  mutation SetAdminWordbookStatus($id: ID!, $status: WordbookStatus!) {
    setAdminWordbookStatus(id: $id, status: $status) {
      success
      errors {
        field
        message
      }
      wordbook {
        id
        status
      }
    }
  }
`);

export type { SetAdminWordbookStatusMutationVariables };

export function useSetAdminWordbookStatusMutation() {
  return useMutation(SetAdminWordbookStatusDocument);
}
