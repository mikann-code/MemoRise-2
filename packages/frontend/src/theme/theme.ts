"use client";

import { createTheme } from "@mui/material/styles";

/**
 * MUI テーマ。色・タイポグラフィなどデザインシステムの基点。
 * 詳細なデザインは MemoRise#2/designs/ に合わせて調整する。
 */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ff7043",
    },
    secondary: {
      main: "#42a5f5",
    },
  },
  typography: {
    fontFamily: [
      "var(--font-noto-sans-jp)",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

export default theme;
