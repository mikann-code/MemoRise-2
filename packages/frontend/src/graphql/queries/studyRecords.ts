"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { StudyRecordsQuery, StudyRecordsQueryVariables } from "@/gql/graphql";

/** 学習記録の月別一覧（カレンダー用・study_details 込み・要ログイン）。 */
export const StudyRecordsDocument = graphql(`
  query StudyRecords($year: Int!, $month: Int!) {
    studyRecords(year: $year, month: $month) {
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

export type { StudyRecordsQuery };

/**
 * useQuery(StudyRecordsDocument) の薄いラッパー。
 * 集計系なので cache-first（docs/frontend.md §7）。記録保存（createStudyRecord）後は
 * mutation 側の evict で次回表示時に再取得される。
 */
export function useStudyRecordsQuery(variables: StudyRecordsQueryVariables) {
  return useQuery(StudyRecordsDocument, { variables, fetchPolicy: "cache-first" });
}
