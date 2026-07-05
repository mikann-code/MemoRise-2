"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SectionTitle } from "@/components/common/ui";
import { useStudyRecordsWeekQuery } from "@/graphql/queries/studyRecordsWeek";

/**
 * 週の継続記録（ホーム）。今週（月〜日）の枠を表示して今日をハイライトし、
 * studyRecordsWeek に接続して学習した日（studyCount > 0）のドットを点灯する。
 * ホームは (auth) 配下（AuthProvider ガード）なので、描画時は常にログイン済み前提。
 */

const WEEK_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weekGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 1.5,
  p: "30px 10px",
  justifyItems: "center",
  maxWidth: 540,
  mx: "auto",
  transition: "transform .3s ease",
  "@media (max-width:768px)": { gap: 0 },
};

const streakItem = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0.75,
  p: "8px 12px",
  "@media (max-width:768px)": { p: "8px 3px" },
};

const dot = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: "50%",
};

// ローカル日付を YYYY-MM-DD で表す（studyRecordsWeek の studyDate と突き合わせる）。
// toISOString は UTC 変換で日付がずれうるため、ローカルの年月日から組み立てる。
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 今週の月曜（月曜始まりに補正: (jsDay - 1 + 7) % 7）。
function thisMonday() {
  const today = new Date();
  const mondayOffset = (today.getDay() - 1 + 7) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  return monday;
}

// 月曜始まりの今週 7 日分。studiedDates に含まれる日（学習済み）を active にする。
function buildThisWeek(monday: Date, studiedDates: Set<string>) {
  const today = new Date();
  return WEEK_EN.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day,
      date: d.getDate(),
      active: studiedDates.has(toISODate(d)),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export default function WeeklyStreakCard() {
  // 学習日ドット用に今週分を取得（ホームは要ログインなので常に取得できる）。
  const monday = thisMonday();
  const { data: weekData } = useStudyRecordsWeekQuery({
    startDate: toISODate(monday),
  });
  const studiedDates = new Set(
    (weekData?.studyRecordsWeek ?? [])
      .filter((r) => r.studyCount > 0)
      .map((r) => r.studyDate),
  );

  const week = buildThisWeek(monday, studiedDates);

  return (
    <Box>
      <SectionTitle icon={<ShowChartIcon />} subTitle="Streak" title="継続記録" />
      <Box
        component={NextLink}
        href="/study-records"
        sx={{
          display: "block",
          textDecoration: "none",
          "&:hover .week": { transform: "scale(1.08)" },
        }}
      >
        <Box
          sx={{
            border: "2px solid var(--color-border)",
            borderRadius: "12px",
            mt: 2.5,
          }}
        >
          <Box className="week" sx={weekGrid}>
            {week.map((it) => (
              <Box
                key={it.day}
                sx={{
                  ...streakItem,
                  ...(it.isToday
                    ? { backgroundColor: "var(--color-primary)", borderRadius: "30px" }
                    : {}),
                }}
              >
                <Typography sx={{ fontSize: 14 }}>{it.day}</Typography>
                <Typography sx={{ fontSize: 14 }}>{it.date}</Typography>
                <Box
                  sx={{
                    ...dot,
                    ...(it.active
                      ? { backgroundColor: "var(--color-bg-secondary)" }
                      : {}),
                  }}
                >
                  {it.active && (
                    <LocalFireDepartmentIcon
                      sx={{ color: "var(--color-primary)", fontSize: 18 }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
