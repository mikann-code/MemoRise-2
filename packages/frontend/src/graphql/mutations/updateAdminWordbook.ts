"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { UpdateAdminWordbookMutationVariables } from "@/gql/graphql";

/** 公式単語帳の更新（管理者専用。親の label / level 変更は章へ伝播）。 */
export const UpdateAdminWordbookDocument = graphql(`
  mutation UpdateAdminWordbook(
    $id: ID!
    $title: String
    $description: String
    $label: String
    $level: String
    $orderIndex: Int
  ) {
    updateAdminWordbook(
      id: $id
      title: $title
      description: $description
      label: $label
      level: $level
      orderIndex: $orderIndex
    ) {
      success
      errors {
        field
        message
      }
      wordbook {
        id
        title
        description
        label
        level
        orderIndex
        parentId
      }
    }
  }
`);

export type { UpdateAdminWordbookMutationVariables };

export function useUpdateAdminWordbookMutation() {
  return useMutation(UpdateAdminWordbookDocument);
}
