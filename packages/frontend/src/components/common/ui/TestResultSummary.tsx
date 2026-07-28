"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

/**
 * テスト結果のサマリー（結果画面の一番上に置く「何問正解したか」の主役表示）。
 * 見た目は学習記録ダッシュボードに寄せ、スコア（DailyRecordCard の大きい数字）→
 * 正答率バー（テスト中の TestProgress と同じグラデーション）→ 内訳タイル
 * （マイページの統計タイル）の順に並べる。
 * 直下に「間違えた単語を復習リストに登録」を置く前提なので、不正解の件数まで見せる。
 */
const tileSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0.5,
  py: 2,
  borderRadius: "12px",
  backgroundColor: "var(--color-bg-tertiary)",
} as const;

export default function TestResultSummary({
  correctCount,
  total,
}: {
  correctCount: number;
  total: number;
}) {
  const wrongCount = total - correctCount;
  const rate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <Box
      sx={{
        border: "2px solid var(--color-border)",
        borderRadius: "16px",
        p: 3,
      }}
    >
      {/* スコア（主役） */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 0.75,
        }}
      >
        <Typography
          sx={{
            fontSize: 40,
            fontWeight: 700,
            color: "var(--color-primary)",
            lineHeight: 1,
          }}
        >
          {correctCount}
        </Typography>
        <Typography
          sx={{ fontSize: 18, color: "var(--color-font-secondary)" }}
        >
          / {total}
        </Typography>
        <Typography sx={{ fontSize: 14, ml: 0.5 }}>問正解</Typography>
      </Box>

      {/* 正答率 */}
      <Box sx={{ mt: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 14,
            color: "#dddddd",
            mb: 0.75,
          }}
        >
          <span>正答率 {rate}%</span>
        </Box>
        <Box
          sx={{
            width: "100%",
            height: 8,
            borderRadius: "999px",
            overflow: "hidden",
            backgroundColor: "var(--color-bg-tertiary)",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${rate}%`,
              borderRadius: "999px",
              background: "linear-gradient(90deg, #ff9f43, #ff6b6b)",
            }}
          />
        </Box>
      </Box>

      {/* 内訳（正解 / 不正解） */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          mt: 2.5,
        }}
      >
        <Box sx={tileSx}>
          <CheckIcon sx={{ color: "#4caf50" }} />
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#4caf50" }}>
            {correctCount}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: "var(--color-font-secondary)" }}
          >
            正解
          </Typography>
        </Box>
        <Box sx={tileSx}>
          <CloseIcon sx={{ color: "#f44336" }} />
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#f44336" }}>
            {wrongCount}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: "var(--color-font-secondary)" }}
          >
            不正解
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
