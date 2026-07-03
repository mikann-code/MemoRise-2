"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import StarIcon from "@mui/icons-material/Star";
import { SectionTitle } from "@/components/common/ui";
import { fallbackWords } from "@/constants/fallbackWords";

/**
 * 今日の一問（ホーム）。todayWord / taggedWords API は v2 未実装のため、
 * v1 と同じくマウント時に fallbackWords から 1 件だけ抽選して表示し、
 * 復習バッジは 0 件のプレースホルダで先行表示する（API 接続は後続）。
 */

// 復習ボタン（青系の立体ボタン。DailyWord 専用）。
const reviewButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.75,
  px: "14px",
  py: "8px",
  borderRadius: "6px",
  backgroundColor: "#3b82f6",
  color: "var(--color-font-primary)",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
  boxShadow: "0 4px 0 #173462",
  transition: "all .2s ease",
  "&:hover": {
    backgroundColor: "#2563eb",
    transform: "translateY(2px)",
    boxShadow: "0 1px 0 #173462",
  },
  "@media (max-width:768px)": { px: 1, py: 0.75, fontSize: 12 },
};

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
  // 乱数は SSR とクライアントで一致しないためハイドレーション不一致を招く。
  // 初期値は決定的（先頭）にし、マウント後（クライアント）に 1 回だけ抽選する。
  const [word, setWord] = useState<(typeof fallbackWords)[number]>(
    fallbackWords[0],
  );
  useEffect(() => {
    setWord(fallbackWords[Math.floor(Math.random() * fallbackWords.length)]);
  }, []);
  // 復習単語 API は未実装のため 0 件（UI のみ先行）。
  const reviewCount = 0;

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
        <Box component={NextLink} href="/wordbooks/review" sx={reviewButton}>
          <StarIcon sx={{ fontSize: 16 }} /> 復習単語 ( {reviewCount} )
        </Box>
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
