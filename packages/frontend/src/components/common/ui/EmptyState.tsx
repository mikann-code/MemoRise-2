"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * 一覧などが空のときの表示。各ページでバラバラだった空状態（1 行テキスト / アイコン付きなど）を
 * 統一する。アイコン・見出し・補足・アクション（任意）を受ける Slot 型。
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        py: 6,
        px: 2,
      }}
    >
      {icon && (
        <Box
          sx={{
            display: "flex",
            color: "var(--color-font-secondary)",
            "& svg": { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography sx={{ color: "var(--color-font-primary)", fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ color: "var(--color-font-secondary)", fontSize: 14 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
