"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminWordbooksQuery } from "@/gql/graphql";

/** 公式単語帳の教材一覧（管理者専用）。 */
export const AdminWordbooksDocument = graphql(`
  query AdminWordbooks {
    adminWordbooks {
      id
      title
      description
      label
      level
      wordsCount
    }
  }
`);

export type { AdminWordbooksQuery };

export function useAdminWordbooksQuery() {
  return useQuery(AdminWordbooksDocument, { fetchPolicy: "cache-and-network" });
}
