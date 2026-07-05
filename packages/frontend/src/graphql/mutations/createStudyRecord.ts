"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CreateStudyRecordMutationVariables } from "@/gql/graphql";

/**
 * テスト終了時の学習記録の保存（日次サマリー累積 + 詳細追加 + streak 更新を 1 トランザクションで）。
 * 学習日はサーバー日付で記録される。記録の種類は kind で明示する
 * （WORDBOOK = 単語帳のテスト・wordbookId 必須 / REVIEW = 復習専用テスト・wordbookId 不可）。
 */
export const CreateStudyRecordDocument = graphql(`
  mutation CreateStudyRecord(
    $kind: StudyRecordKind!
    $totalCount: Int!
    $correctCount: Int!
    $wordbookId: ID
  ) {
    createStudyRecord(
      kind: $kind
      totalCount: $totalCount
      correctCount: $correctCount
      wordbookId: $wordbookId
    ) {
      success
      errors {
        field
        message
      }
      studyRecord {
        id
        studyDate
        studyCount
      }
    }
  }
`);

export type { CreateStudyRecordMutationVariables };

export function useCreateStudyRecordMutation() {
  return useMutation(CreateStudyRecordDocument);
}
