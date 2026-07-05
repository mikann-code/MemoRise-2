"use client";

import { startTransition, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { SectionTitle, LoadingSpinner } from "@/components/common/ui";
import { ErrorCard } from "@/components/common/card";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import WordbookTest from "@/components/feature/WordbookTest";

type Word = { id: string; question: string; answer: string };

/** Fisher–Yates で出題順をシャッフルする（元配列は変えない）。 */
function shuffle(words: readonly Word[]): Word[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 復習専用テスト（要件 3.5）。復習タグ付き単語（単語帳横断）だけを出題する。
 * 復習単語一覧（/wordbooks/review）の「今すぐはじめる」から入る
 * （自作単語帳の 一覧 → テスト と同じ導線）。
 * 出題はテスト開始時のスナップショットで固定し、テスト中のタグ操作（refetch）で
 * 出題順・出題数が変わらないようにする。記録は単語帳なし（wordbookId 未指定）で保存される。
 */
export default function ReviewTestPage() {
  const { taggedWords, loading } = useReviewTags();

  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);

  useEffect(() => {
    // 開始後（1 回シャッフルした後）は並べ替えない。誤答・タグ操作の refetch に影響されない。
    if (shuffledWords.length > 0) return;
    if (taggedWords.length === 0) return;
    startTransition(() => {
      setShuffledWords(shuffle(taggedWords));
    });
  }, [taggedWords, shuffledWords.length]);

  // テスト開始前だけ空状態・ローディングを判定する。開始後（シャッフル済み）は
  // 結果画面でタグを外して 0 件になっても、テスト・結果画面を出したままにする。
  if (shuffledWords.length === 0) {
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

    // 取得中 or startTransition の反映待ち（シャッフル前の順で出題しない）
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return <WordbookTest words={shuffledWords} />;
}
