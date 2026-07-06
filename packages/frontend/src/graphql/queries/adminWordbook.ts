"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { AdminWordbookQuery, AdminWordbookQueryVariables } from "@/gql/graphql";

/** 公式単語帳 1 件（教材なら章、章なら単語まで。管理者専用）。 */
export const AdminWordbookDocument = graphql(`
  query AdminWordbook($id: ID!) {
    adminWordbook(id: $id) {
      id
      title
      description
      label
      level
      orderIndex
      wordsCount
      parentId
      children {
        id
        title
        orderIndex
        wordsCount
      }
      words {
        id
        question
        answer
      }
    }
  }
`);

export type { AdminWordbookQuery };

// id 必須なので variables を渡す。options を必須にすることで useQuery の overload が
// 正確な TData を推論する（optional にすると DeepPartial に落ちてビルドが壊れる）。
export function useAdminWordbookQuery(
  options: Parameters<typeof useQuery<AdminWordbookQuery, AdminWordbookQueryVariables>>[1],
) {
  return useQuery(AdminWordbookDocument, options);
}
