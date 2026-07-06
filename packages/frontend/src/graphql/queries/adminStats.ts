"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminStatsQuery } from "@/gql/graphql";

/** 統計（ユーザー数・単語数など。管理者専用）。 */
export const AdminStatsDocument = graphql(`
  query AdminStats {
    adminStats {
      usersCount
      wordsCount
      officialWordbooksCount
      personalWordbooksCount
    }
  }
`);

export type { AdminStatsQuery };

export function useAdminStatsQuery() {
  return useQuery(AdminStatsDocument, { fetchPolicy: "cache-and-network" });
}
