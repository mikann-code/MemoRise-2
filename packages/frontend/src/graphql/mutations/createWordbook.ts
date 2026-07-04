"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CreateWordbookMutationVariables } from "@/gql/graphql";

/** 自作単語帳の作成（要ログイン）。 */
export const CreateWordbookDocument = graphql(`
  mutation CreateWordbook($title: String!, $description: String, $label: String) {
    createWordbook(title: $title, description: $description, label: $label) {
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
        wordsCount
        lastStudied
      }
    }
  }
`);

export type { CreateWordbookMutationVariables };

export function useCreateWordbookMutation() {
  return useMutation(CreateWordbookDocument);
}
