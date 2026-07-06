"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminUsersQuery, AdminUsersQueryVariables } from "@/gql/graphql";

/** ユーザー一覧（管理者専用・キーワード検索/並び替え/ページング対応）。 */
export const AdminUsersDocument = graphql(`
  query AdminUsers(
    $page: Int
    $perPage: Int
    $keyword: String
    $sortBy: AdminUserSortField
    $sortOrder: SortOrder
  ) {
    adminUsers(
      page: $page
      perPage: $perPage
      keyword: $keyword
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      totalCount
      nodes {
        id
        name
        email
        role
        wordsCount
        streak
        createdAt
      }
    }
  }
`);

export type { AdminUsersQuery };

export function useAdminUsersQuery(variables: AdminUsersQueryVariables) {
  return useQuery(AdminUsersDocument, {
    variables,
    fetchPolicy: "cache-and-network",
  });
}
