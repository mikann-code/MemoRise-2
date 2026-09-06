"use client";

import { startTransition, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { SectionTitle, LoadingContainer } from "@/components/common/ui";
import { ErrorCard } from "@/components/common/card";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import WordbookTest from "@/components/feature/WordbookTest";

type Word = { id: string; question: string; answer: string };

/**
 * 復習専用テスト（要件 3.5）。復習タグ付き単語（単語帳横断）だけを出題する。
 * 復習単語一覧（/wordbooks/review）の「今すぐはじめる」から入る
 * （自作単語帳の 一覧 → テスト と同じ導線）。
 * 出題はテスト開始時のスナップショットで固定し、テスト中のタグ操作（refetch）で
 * 出題数が変わらないようにする（シャッフルは WordbookTest 側で一度だけ行う）。
 * 記録は単語帳なし（wordbookId 未指定）で保存される。
 */
export default function ReviewTestPage() {
  const { taggedWords, loading } = useReviewTags();

  const [startedWords, setStartedWords] = useState<readonly Word[]>([]);

  useEffect(() => {
    // 出題対象は最初に復習単語が取れた時点で確定させ、以降は差し替えない
    // （テスト中・結果画面でのタグ操作による refetch で出題数が変わらないようにする）。
    if (startedWords.length > 0) return;
    if (taggedWords.length === 0) return;
    startTransition(() => {
      setStartedWords(taggedWords);
    });
  }, [taggedWords, startedWords.length]);

  // テスト開始前だけ空状態・ローディングを判定する。開始後は結果画面でタグを外して
  // 0 件になっても、テスト・結果画面を出したままにする。
  if (startedWords.length === 0) {
    if (taggedWords.length === 0 && !loading) {
      return (
        <Box>
          <SectionTitle
            icon={<SellOutlinedIcon />}
            subTitle="Review Test"
            title="復習テスト"
          />
          <Box sx={{ mt: 2.5 }}>
            <ErrorCard
              text={
                <>
                  まだ復習単語がありません。
                  <br />
                  単語一覧やテスト結果から追加できます。
                </>
              }
              buttonLabel="復習単語一覧を見る"
              href="/wordbooks/review"
            />
          </Box>
        </Box>
      );
    }

    // 復習タグの取得中
    return <LoadingContainer />;
  }

  return <WordbookTest backHref="/wordbooks/review" words={startedWords} />;
}
