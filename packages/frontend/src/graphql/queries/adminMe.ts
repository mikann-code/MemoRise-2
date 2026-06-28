"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminMeQuery, AdminMeQueryVariables } from "@/gql/graphql";

/** 現在のセッションの管理者を取得する Query。管理者でなければ（role 不一致・未認証とも）null。 */
export const AdminMeDocument = graphql(`
  query AdminMe {
    adminMe {
      id
      name
      email
      role
    }
  }
`);

export type { AdminMeQuery };

/** useQuery(AdminMeDocument) の薄いラッパー（fetchPolicy 等のオプションはそのまま渡せる）。 */
export function useAdminMeQuery(
  options?: Parameters<typeof useQuery<AdminMeQuery, AdminMeQueryVariables>>[1],
) {
  return useQuery(AdminMeDocument, options);
}
