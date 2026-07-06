"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CreateAdminWordbookMutationVariables } from "@/gql/graphql";

/** 公式単語帳の作成（管理者専用。parentId 指定で章を作成）。 */
export const CreateAdminWordbookDocument = graphql(`
  mutation CreateAdminWordbook(
    $title: String!
    $description: String
    $label: String
    $level: String
    $parentId: ID
    $orderIndex: Int
  ) {
    createAdminWordbook(
      title: $title
      description: $description
      label: $label
      level: $level
      parentId: $parentId
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
        parentId
      }
    }
  }
`);

export type { CreateAdminWordbookMutationVariables };

export function useCreateAdminWordbookMutation() {
  return useMutation(CreateAdminWordbookDocument);
}
