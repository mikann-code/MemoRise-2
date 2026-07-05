"use client";

import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { TodayWordQuery } from "@/gql/graphql";

/** 今日の一問（公式単語からランダム 1 件・要ログイン。公式単語が無ければ null）。 */
export const TodayWordDocument = graphql(`
  query TodayWord {
    todayWord {
      id
      question
      answer
    }
  }
`);

export type { TodayWordQuery };

/**
 * useQuery(TodayWordDocument) の薄いラッパー。
 * 取得失敗時もクエリを止めず（errorPolicy: "all"）、DailyWord 側で
 * 内蔵 fallbackWords に切り替えられるようにする（docs/frontend.md §4）。
 */
export function useTodayWordQuery() {
  return useQuery(TodayWordDocument, { errorPolicy: "all" });
}
