"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

/**
 * 管理画面の各ページ共通ヘッダ。戻り先リンク（← ラベル）とタイトル、
 * 右側に任意のアクション（新規作成ボタン等）を並べる。
 * 管理空間は共通 Header を持たないため、各ページがこれで戻り導線を確保する。
 */
export default function AdminPageHeader({
  title,
  backHref,
  backLabel = "戻る",
  action,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        component={NextLink}
        href={backHref}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          color: "#9aa0a6",
          fontSize: 13,
          textDecoration: "none",
          mb: 1,
          "&:hover": { color: "var(--color-primary)" },
        }}
      >
        <ChevronLeftIcon sx={{ fontSize: 18 }} />
        {backLabel}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="h5" component="h1" fontWeight={700} color="primary">
          {title}
        </Typography>
        {action}
      </Box>
    </Box>
  );
}
