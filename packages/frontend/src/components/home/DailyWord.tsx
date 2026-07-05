"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import StarIcon from "@mui/icons-material/Star";
import { SectionTitle, Button } from "@/components/common/ui";
import { fallbackWords } from "@/constants/fallbackWords";
import { useTodayWordQuery } from "@/graphql/queries/todayWord";
import { useTaggedWordsQuery } from "@/graphql/queries/taggedWords";

/**
 * 今日の一問（ホーム）。todayWord（公式単語からランダム 1 件）に接続し、
 * 取得中・取得失敗・公式単語 0 件（null）のときは内蔵 fallbackWords から
 * 1 件抽選して表示し、初回ロードの空白を防ぐ。
 * 復習バッジは taggedWords クエリの実数（取得失敗・取得中は 0 件表示のフォールバック）。
 */

const wordCell = {
  flex: 1,
  py: 2.5,
  fontWeight: 500,
  fontFamily: "var(--font-primary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function DailyWord() {
  // フォールバック用の抽選。乱数は SSR とクライアントで一致せずハイドレーション不一致を
  // 招くため、初期値は決定的（先頭）にし、マウント後（クライアント）に 1 回だけ抽選する。
  const [fallbackWord, setFallbackWord] = useState<
    (typeof fallbackWords)[number]
  >(fallbackWords[0]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ハイドレーション対策のマウント後 1 回抽選（外部システム同期ではない意図的な例外）
    setFallbackWord(
      fallbackWords[Math.floor(Math.random() * fallbackWords.length)],
    );
  }, []);

  // API が単語を返せば優先し、取得中・失敗・公式単語 0 件のときは抽選済みフォールバックを表示。
  const { data: todayData } = useTodayWordQuery();
  const word = todayData?.todayWord ?? fallbackWord;

  const { data } = useTaggedWordsQuery();
  const reviewCount = data?.taggedWords.length ?? 0;

  return (
    <Box component="section">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <SectionTitle
          icon={<LightbulbOutlinedIcon />}
          subTitle="Today’s Vocab"
          title="今日の一問"
        />
        <Button
          href="/wordbooks/review"
          size="compact"
          color="#3b82f6"
          hoverColor="#2563eb"
        >
          <StarIcon sx={{ fontSize: 16 }} /> 復習単語 ( {reviewCount} )
        </Button>
      </Box>

      <Box
        sx={{
          position: "relative",
          border: "2px solid var(--color-border)",
          borderRadius: "12px",
          mt: 2.5,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box sx={{ ...wordCell, fontSize: 30, textAlign: "center" }}>
          {word.question}
        </Box>
        <Box
          sx={{
            ...wordCell,
            fontSize: 20,
            borderLeft: "1px dashed var(--color-border)",
          }}
        >
          {word.answer}
        </Box>
      </Box>
    </Box>
  );
}
