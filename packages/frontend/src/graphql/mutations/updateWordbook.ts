"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { UpdateWordbookMutationVariables } from "@/gql/graphql";

/** 自作単語帳の更新（本人のみ）。 */
export const UpdateWordbookDocument = graphql(`
  mutation UpdateWordbook($id: ID!, $title: String, $description: String, $label: String) {
    updateWordbook(id: $id, title: $title, description: $description, label: $label) {
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
      }
    }
  }
`);

export type { UpdateWordbookMutationVariables };

export function useUpdateWordbookMutation() {
  return useMutation(UpdateWordbookDocument);
}
