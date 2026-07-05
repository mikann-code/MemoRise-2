"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { StudyRecordsRecentQuery } from "@/gql/graphql";

/** 直近の学習記録一覧（新しい日付順・最大 30 件・要ログイン）。 */
export const StudyRecordsRecentDocument = graphql(`
  query StudyRecordsRecent {
    studyRecordsRecent {
      id
      studyDate
      studyCount
      studyDetails {
        id
        title
        rate
        totalCount
        correctCount
      }
    }
  }
`);

export type { StudyRecordsRecentQuery };

/**
 * useQuery(StudyRecordsRecentDocument) の薄いラッパー。
 * 集計系なので cache-first（docs/frontend.md §7）。記録保存（createStudyRecord）後は
 * mutation 側の evict で次回表示時に再取得される。
 */
export function useStudyRecordsRecentQuery() {
  return useQuery(StudyRecordsRecentDocument, { fetchPolicy: "cache-first" });
}
