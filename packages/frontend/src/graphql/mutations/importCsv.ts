"use client";

import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { ImportCsvMutationVariables } from "@/gql/graphql";

/** 公式単語帳への単語の CSV 一括登録（管理者専用・行番号付きエラー）。 */
export const ImportCsvDocument = graphql(`
  mutation ImportCsv($wordbookId: ID!, $csv: String!) {
    importCsv(wordbookId: $wordbookId, csv: $csv) {
      success
      errors {
        field
        message
      }
      importedCount
      wordbook {
        id
        wordsCount
      }
    }
  }
`);

export type { ImportCsvMutationVariables };

export function useImportCsvMutation() {
  return useMutation(ImportCsvDocument);
}
