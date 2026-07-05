"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { UpdateProfileMutationVariables } from "@/gql/graphql";

export const UpdateProfileDocument = graphql(`
  mutation UpdateProfile(
    $name: String!
    $password: String
    $passwordConfirmation: String
  ) {
    updateProfile(
      name: $name
      password: $password
      passwordConfirmation: $passwordConfirmation
    ) {
      success
      errors {
        field
        message
      }
      user {
        id
        name
        email
        role
        streak
        wordsCount
      }
    }
  }
`);

export type { UpdateProfileMutationVariables };

export function useUpdateProfileMutation() {
  return useMutation(UpdateProfileDocument);
}
