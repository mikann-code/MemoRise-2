"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SectionTitle, Button, ButtonSecondary } from "@/components/common/ui";
import { useMeQuery } from "@/graphql/queries/me";

/**
 * 週の継続記録（ホーム）。studyWeekRecords API は v2 未実装のため、
 * ログイン時は今週（月〜日）の枠だけを表示して今日をハイライトし（学習日ドットは
 * API 接続後に点灯）、未ログイン時はログイン導線カードに差し替える（v1 踏襲）。
 */

const WEEK_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const loginActions = {
  width: 500,
  display: "flex",
  gap: 1.25,
  mx: "auto",
  pb: 5,
  "@media (max-width:768px)": { width: 200, flexDirection: "column", gap: 1.75 },
};

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

// 月曜始まりに補正した今週 7 日分（(jsDay - 1 + 7) % 7）。
function buildThisWeek() {
  const today = new Date();
  const mondayOffset = (today.getDay() - 1 + 7) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return WEEK_EN.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day,
      date: d.getDate(),
      active: false, // studyWeekRecords 未接続のため一律 false
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export default function WeeklyStreakCard() {
  const { data: meData, loading } = useMeQuery({ errorPolicy: "all" });
  const user = meData?.me ?? null;

  const header = (
    <SectionTitle icon={<ShowChartIcon />} subTitle="Streak" title="継続記録" />
  );

  if (loading) return null;

  if (!user) {
    return (
      <Box>
        {header}
        <Box
          sx={{
            border: "2px solid var(--color-border)",
            borderRadius: "12px",
            mt: 2.5,
          }}
        >
          <Typography sx={{ color: "#ccc", textAlign: "center", p: 2.5 }}>
            継続記録を見るにはログインが必要です
          </Typography>
          <Box sx={loginActions}>
            <Button href="/login">ログインする</Button>
            <ButtonSecondary href="/signup">新規登録</ButtonSecondary>
          </Box>
        </Box>
      </Box>
    );
  }

  const week = buildThisWeek();

  return (
    <Box>
      {header}
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
