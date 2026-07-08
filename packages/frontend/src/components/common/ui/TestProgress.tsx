"use client";

import Box from "@mui/material/Box";

/**
 * テストの進捗表示（「N / M 問目・正答率」＋オレンジ→レッドのグラデーション進捗バー）。
 * WordbookTest / PublicWordbookTest で同一実装だったものを共通化（v1 の <progress> を踏襲）。
 * - current / total / rate：上段の表示テキスト
 * - filled：進捗バーの充填量（回答済み数。結果画面では total を渡して満タンにする）
 */
export default function TestProgress({
  current,
  total,
  rate,
  filled,
}: {
  current: number;
  total: number;
  rate: number;
  filled: number;
}) {
  const ratio = total > 0 ? (filled / total) * 100 : 0;
  return (
    <Box sx={{ mb: 5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          color: "#dddddd",
          mb: 0.75,
        }}
      >
        <span>
          {current} / {total} 問目
        </span>
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
            width: `${ratio}%`,
            borderRadius: "999px",
            background: "linear-gradient(90deg, #ff9f43, #ff6b6b)",
            transition: "width .3s ease",
          }}
        />
      </Box>
    </Box>
  );
}
