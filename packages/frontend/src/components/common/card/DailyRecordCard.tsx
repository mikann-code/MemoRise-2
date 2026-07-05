"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * studyRecords 系クエリの 1 日分（カード表示に必要なフィールドだけの構造型）。
 * 月別・直近どちらのクエリ結果もこの形を満たすので共用する。
 */
export type StudyRecordItem = {
  id: string;
  studyDate: string;
  studyCount: number;
  studyDetails: {
    id: string;
    title?: string | null;
    rate: number;
    totalCount: number;
    correctCount: number;
  }[];
};

/**
 * 学習記録 1 日分のカード（v1 DailyRecordCard 踏襲）。
 * 日付バッジ + 学習量（words）を主役に、テストごとの詳細
 * （タイトル / 正答数 / 正答率）を左ボーダー付きの行で並べる。
 * 正答率 80% 以上は緑でハイライトする。
 */
export default function DailyRecordCard({ record }: { record: StudyRecordItem }) {
  // "YYYY-MM-DD" を文字列のまま分解する（Date 経由のタイムゾーンずれを避ける）。
  const [, month, day] = record.studyDate.split("-").map(Number);

  return (
    <Box
      sx={{
        backgroundColor: "var(--color-bg-tertiary)",
        borderRadius: "14px",
        p: "16px 20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease",
        "&:hover": { boxShadow: "0 6px 14px rgba(0,0,0,0.1)" },
      }}
    >
      <Box sx={{ display: "flex", mb: 0.5, pl: 1 }}>
        <Typography
          sx={{
            backgroundColor: "rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 500,
            color: "#e5e7eb",
            px: 1.5,
            py: "2px",
            borderRadius: "12px",
          }}
        >
          {month}月{day}日
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pl: 1 }}>
        {/* 学習量（主役） */}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography
            sx={{ fontSize: 30, fontWeight: 700, color: "var(--color-primary)" }}
          >
            {record.studyCount}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#999999" }}>words</Typography>
        </Box>

        {/* 詳細ログ（テストごと） */}
        {record.studyDetails.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {record.studyDetails.map((detail) => (
              <Box
                key={detail.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  pl: 1.5,
                  borderLeft: "2px solid rgba(255, 165, 0, 0.6)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#e5e7eb",
                    lineHeight: 1.4,
                  }}
                >
                  {detail.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Typography component="span" sx={{ fontSize: 12, color: "#9ca3af" }}>
                    {detail.correctCount}/{detail.totalCount}
                  </Typography>
                  <Typography
                    component="span"
                    sx={
                      detail.rate >= 80
                        ? { fontSize: 12, color: "#22c55e", fontWeight: 600 }
                        : { fontSize: 12, color: "#e5e7eb" }
                    }
                  >
                    {detail.rate}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
