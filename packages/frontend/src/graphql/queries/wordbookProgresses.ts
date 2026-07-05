"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type {
  WordbookProgressesQuery,
  WordbookProgressesQueryVariables,
} from "@/gql/graphql";

export const WordbookProgressesDocument = graphql(`
  query WordbookProgresses($wordbookId: ID!) {
    wordbookProgresses(wordbookId: $wordbookId) {
      id
      wordbookId
      completed
    }
  }
`);

export type { WordbookProgressesQuery };

export function useWordbookProgressesQuery(
  options: Parameters<
    typeof useQuery<WordbookProgressesQuery, WordbookProgressesQueryVariables>
  >[1],
) {
  return useQuery(WordbookProgressesDocument, options);
}
