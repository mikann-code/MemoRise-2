"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type {
  StudyRecordsWeekQuery,
  StudyRecordsWeekQueryVariables,
} from "@/gql/graphql";

/** 学習記録の週別一覧（startDate から 7 日分・週 streak 用・要ログイン）。 */
export const StudyRecordsWeekDocument = graphql(`
  query StudyRecordsWeek($startDate: ISO8601Date!) {
    studyRecordsWeek(startDate: $startDate) {
      id
      studyDate
      studyCount
    }
  }
`);

export type { StudyRecordsWeekQuery };

/**
 * useQuery(StudyRecordsWeekDocument) の薄いラッパー。
 * 集計系なので cache-first（docs/frontend.md §7）。記録保存（createStudyRecord）後は
 * mutation 側の evict で次回表示時に再取得される。
 */
export function useStudyRecordsWeekQuery(
  variables: StudyRecordsWeekQueryVariables,
) {
  return useQuery(StudyRecordsWeekDocument, {
    variables,
    fetchPolicy: "cache-first",
  });
}
