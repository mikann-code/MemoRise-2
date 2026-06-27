"use client";

import { createTheme } from "@mui/material/styles";

/**
 * MUI テーマ。デザイントークン（globals.css の :root）と同値をダークベースで定義する。
 * 見出しは Zen Maru Gothic（--font-primary）、本文は Noto Sans JP（--font-secondary）。
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffa94d" },
    secondary: { main: "#ff8c00" },
    error: { main: "#ff7a7a" },
    success: { main: "#a3e635" },
    background: { default: "#222222", paper: "#333333" },
    text: { primary: "#ffffff", secondary: "#aaaaaa" },
    divider: "#555555",
  },
  typography: {
    fontFamily: "var(--font-secondary), 'Noto Sans JP', sans-serif",
    // 見出しは Zen Maru Gothic 系
    h1: { fontFamily: "var(--font-primary), sans-serif" },
    h2: { fontFamily: "var(--font-primary), sans-serif" },
    h3: { fontFamily: "var(--font-primary), sans-serif" },
    h4: { fontFamily: "var(--font-primary), sans-serif" },
    h5: { fontFamily: "var(--font-primary), sans-serif" },
    h6: { fontFamily: "var(--font-primary), sans-serif" },
  },
});

export default theme;
