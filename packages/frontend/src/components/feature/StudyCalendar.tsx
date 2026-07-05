"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LoadingSpinner } from "@/components/common/ui";
import DailyRecordCard from "@/components/common/card/DailyRecordCard";
import { useStudyRecordsQuery } from "@/graphql/queries/studyRecords";

/** 週初めは月曜（docs/frontend.md §8：(jsDay - 1 + 7) % 7 で補正）。 */
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

/** 学習数バッジのヒートマップ上限（v1 踏襲：/100 で青の濃さを変える）。 */
const HEAT_MAX = 100;

/** 月グリッドのセル。前後月の日も枠として並べる（グレー表示・クリック不可）。 */
function buildCells(monthStart: Dayjs) {
  const offset = (monthStart.day() - 1 + 7) % 7;
  const gridStart = monthStart.subtract(offset, "day");
  const count = Math.ceil((offset + monthStart.daysInMonth()) / 7) * 7;

  return Array.from({ length: count }, (_, i) => {
    const date = gridStart.add(i, "day");
    return {
      date,
      dateStr: date.format("YYYY-MM-DD"),
      inMonth: date.month() === monthStart.month(),
    };
  });
}

/**
 * 学習カレンダー（v1 StudyCalendar 踏襲・FullCalendar の代わりに自前グリッド）。
 * studyRecords(year, month) を月送りで取得し、学習した日はマス強調 +
 * study_count バッジ（件数比で青の濃さを変えるヒートマップ）。
 * 日付を選ぶとその日の記録（study_details のタイトル / 正答率 / 問題数）を
 * カレンダー下に表示する（v1 の alert を廃止。window.alert は使わない）。
 */
export default function StudyCalendar() {
  const [monthStart, setMonthStart] = useState(() => dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = monthStart.year();
  const month = monthStart.month() + 1;
  const { data, loading, error } = useStudyRecordsQuery({ year, month });
  const records = data?.studyRecords ?? [];

  const moveMonth = (diff: number) => {
    setMonthStart((prev) => prev.add(diff, "month"));
    setSelectedDate(null);
  };

  const today = dayjs().format("YYYY-MM-DD");
  const selectedRecord = selectedDate
    ? records.find((r) => r.studyDate === selectedDate)
    : undefined;

  return (
    <Box sx={{ mt: 2.5 }}>
      {/* 月送りヘッダー */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography component="h3" sx={{ fontSize: 20, fontWeight: 500 }}>
          {year}年{month}月
        </Typography>
        <Box>
          <IconButton
            aria-label="前の月"
            onClick={() => moveMonth(-1)}
            sx={{ color: "var(--color-font-primary)" }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="次の月"
            onClick={() => moveMonth(1)}
            sx={{ color: "var(--color-font-primary)" }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {error ? (
        <Typography sx={{ color: "var(--color-error)", mt: 2 }}>
          学習記録の取得に失敗しました。
        </Typography>
      ) : loading ? (
        <Box sx={{ position: "relative", minHeight: 240 }}>
          <LoadingSpinner />
        </Box>
      ) : (
        <>
          {/* 曜日ヘッダー（月曜始まり） */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              mt: 1.5,
            }}
          >
            {WEEKDAYS.map((day) => (
              <Typography
                key={day}
                sx={{
                  fontSize: 13,
                  textAlign: "center",
                  py: 0.75,
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2c2c2c",
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* 日グリッド */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {buildCells(monthStart).map((cell) => {
              const record = cell.inMonth
                ? records.find((r) => r.studyDate === cell.dateStr)
                : undefined;
              const heat = record
                ? 0.4 + Math.min(record.studyCount / HEAT_MAX, 1) * 0.6
                : 0;

              return (
                <Box
                  key={cell.dateStr}
                  component="button"
                  type="button"
                  disabled={!cell.inMonth}
                  aria-label={`${cell.date.month() + 1}月${cell.date.date()}日`}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    position: "relative",
                    minHeight: 76,
                    p: 0.5,
                    border: "1px solid #2c2c2c",
                    backgroundColor: record
                      ? "rgba(255, 165, 0, 0.25)"
                      : cell.dateStr === today
                        ? "rgba(255, 165, 0, 0.15)"
                        : "#1f1f1f",
                    cursor: cell.inMonth ? "pointer" : "default",
                    ...(cell.inMonth && !record
                      ? { "&:hover": { backgroundColor: "rgba(255, 165, 0, 0.1)" } }
                      : {}),
                    ...(selectedDate === cell.dateStr
                      ? { outline: "2px solid var(--color-primary)", outlineOffset: -2 }
                      : {}),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      textAlign: "right",
                      pr: 0.5,
                      color: cell.inMonth ? "var(--color-font-primary)" : "#666666",
                    }}
                  >
                    {cell.date.date()}
                  </Typography>
                  {record && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 40,
                        height: 40,
                        lineHeight: "40px",
                        textAlign: "center",
                        borderRadius: "50%",
                        backgroundColor: `rgba(45, 140, 255, ${heat})`,
                        color: "#ffffff",
                        fontSize: 16,
                        pointerEvents: "none",
                      }}
                    >
                      {record.studyCount}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* 選択した日の詳細 */}
          <Box sx={{ mt: 2.5 }}>
            {selectedRecord ? (
              <DailyRecordCard record={selectedRecord} />
            ) : selectedDate ? (
              <Typography sx={{ fontSize: 13, color: "var(--color-font-secondary)" }}>
                {Number(selectedDate.split("-")[1])}月
                {Number(selectedDate.split("-")[2])}日の記録はありません。
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 13, color: "var(--color-font-secondary)" }}>
                日付を選ぶとその日の記録を表示します。
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
