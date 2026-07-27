"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { OpenWordbookMutationVariables } from "@/gql/graphql";

/**
 * 自作単語帳を開いた記録（本人のみ・冪等）。単語一覧を開いたときに最終閲覧日時を更新する。
 * 単語帳一覧の並び（最近開いた順）と時刻表示が変わるので、保存後は myWordbooks の
 * キャッシュを捨てて次回表示時に再取得させる。
 */
export const OpenWordbookDocument = graphql(`
  mutation OpenWordbook($id: ID!) {
    openWordbook(id: $id) {
      success
      errors {
        field
        message
      }
      wordbook {
        id
        lastStudied
      }
    }
  }
`);

export type { OpenWordbookMutationVariables };

export function useOpenWordbookMutation() {
  return useMutation(OpenWordbookDocument, {
    update(cache) {
      cache.evict({ fieldName: "myWordbooks" });
      cache.gc();
    },
  });
}
