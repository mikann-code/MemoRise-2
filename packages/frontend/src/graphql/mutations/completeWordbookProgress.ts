"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CompleteWordbookProgressMutationVariables } from "@/gql/graphql";

export const CompleteWordbookProgressDocument = graphql(`
  mutation CompleteWordbookProgress($wordbookId: ID!) {
    completeWordbookProgress(wordbookId: $wordbookId) {
      success
      errors {
        field
        message
      }
      progresses {
        id
        wordbookId
        completed
      }
    }
  }
`);

export type { CompleteWordbookProgressMutationVariables };

export function useCompleteWordbookProgressMutation() {
  return useMutation(CompleteWordbookProgressDocument, {
    // 完了/解放でキャッシュ上の進捗一覧を無効化し、教材トップで再取得させる。
    update(cache) {
      cache.evict({ fieldName: "wordbookProgresses" });
      cache.gc();
    },
  });
}
