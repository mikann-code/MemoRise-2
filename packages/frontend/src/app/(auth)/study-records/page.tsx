"use client";

import { useState } from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { SectionTitle, LoadingContainer } from "@/components/common/ui";
import StudyCalendar from "@/components/feature/StudyCalendar";
import { MOBILE_QUERY } from "@/constants/ui";
import DailyRecordCard from "@/components/common/card/DailyRecordCard";
import { useCurrentUser } from "@/lib/auth/authContext";
import { useStudyRecordsWeekQuery } from "@/graphql/queries/studyRecordsWeek";
import { useStudyRecordsRecentQuery } from "@/graphql/queries/studyRecordsRecent";

const WEEK_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weekGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 1.5,
  p: "20px 10px",
  justifyItems: "center",
  maxWidth: 540,
  mx: "auto",
  [MOBILE_QUERY]: { gap: 0 },
};

const streakItem = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0.75,
  p: "8px 12px",
  [MOBILE_QUERY]: { p: "8px 3px" },
};

const dot = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: "50%",
};

/**
 * 連続学習日数（streak）+ 今週の週ストリーク（月曜始まり：(jsDay - 1 + 7) % 7 で補正）。
 * streak は me（AuthProvider の currentUser）、週の学習日は studyRecordsWeek から点灯する
 * （見た目はホームの WeeklyStreakCard 踏襲）。
 */
function StreakSection() {
  const { currentUser } = useCurrentUser();

  const today = dayjs();
  const monday = today.subtract((today.day() - 1 + 7) % 7, "day");
  const { data } = useStudyRecordsWeekQuery({
    startDate: monday.format("YYYY-MM-DD"),
  });
  const weekRecords = data?.studyRecordsWeek ?? [];

  const week = WEEK_EN.map((day, i) => {
    const d = monday.add(i, "day");
    const dateStr = d.format("YYYY-MM-DD");
    return {
      day,
      date: d.date(),
      active: weekRecords.some((r) => r.studyDate === dateStr),
      isToday: dateStr === today.format("YYYY-MM-DD"),
    };
  });

  return (
    <Box
      sx={{
        border: "2px solid var(--color-border)",
        borderRadius: "12px",
        mt: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          pt: 2.5,
        }}
      >
        <LocalFireDepartmentIcon
          sx={{ color: "var(--color-primary)", fontSize: 22 }}
        />
        <Typography sx={{ fontSize: 15 }}>
          連続学習
          <Box
            component="span"
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-primary)",
              mx: 0.5,
            }}
          >
            {currentUser.streak}
          </Box>
          日
        </Typography>
      </Box>

      <Box sx={weekGrid}>
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
  );
}

/** ダッシュボードタブ：直近の学習記録一覧（最新 30 件・v1 踏襲）。 */
function RecentRecords() {
  const { data, loading, error } = useStudyRecordsRecentQuery();
  const records = data?.studyRecordsRecent ?? [];

  if (loading) {
    return (
      <LoadingContainer />
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "var(--color-error)", mt: 2 }}>
        学習記録の取得に失敗しました。
      </Typography>
    );
  }

  return (
    <>
      <Typography
        sx={{ mt: 1.25, fontSize: 12, color: "var(--color-font-secondary)" }}
      >
        最近の学習記録一覧（最新30件）
      </Typography>
      {records.length === 0 ? (
        <Typography
          sx={{ mt: 2, fontSize: 13, color: "var(--color-font-secondary)" }}
        >
          学習記録はまだありません。テストを終えると記録が増えていきます。
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 1.25 }}>
          {records.map((record) => (
            <DailyRecordCard key={record.id} record={record} />
          ))}
        </Box>
      )}
    </>
  );
}

/**
 * 学習記録（/study-records）。streak + 週ストリークの下に、
 * 「記録（カレンダー）/ ダッシュボード（直近一覧）」のタブを置く（v1 踏襲）。
 * ログインガードは (auth)/layout.tsx（AuthProvider）に委ねる。
 */
export default function StudyRecordsPage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "dashboard">(
    "calendar",
  );

  const tabSx = (active: boolean) => ({
    all: "unset",
    boxSizing: "border-box",
    width: "100%",
    textAlign: "center",
    borderRadius: "8px 8px 0 0",
    border: active
      ? "2px solid var(--color-primary)"
      : "2px solid var(--color-border)",
    py: 1,
    cursor: "pointer",
    fontSize: 14,
  });

  return (
    <Box sx={{ py: 1 }}>
      <SectionTitle
        icon={<ShowChartIcon />}
        subTitle="My Study Records"
        title="学習記録"
      />

      <StreakSection />

      {/* タブ切替（記録 = カレンダー / ダッシュボード = 直近一覧） */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.25,
          width: "100%",
          mt: 1.5,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => setActiveTab("calendar")}
          sx={tabSx(activeTab === "calendar")}
        >
          記録
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => setActiveTab("dashboard")}
          sx={tabSx(activeTab === "dashboard")}
        >
          ダッシュボード
        </Box>
      </Box>

      {activeTab === "calendar" && <StudyCalendar />}
      {activeTab === "dashboard" && <RecentRecords />}
    </Box>
  );
}
