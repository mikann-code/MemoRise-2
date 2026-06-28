"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/lib/auth/useAuth";
import { useCurrentUser } from "@/lib/auth/authContext";

/**
 * 共通ヘッダー。AuthProvider 配下（(auth) グループ）でのみ使用し、
 * currentUser は Context（useCurrentUser）から受け取る（自前で me を引かない）。
 * これにより me の取得は AuthProvider の 1 クエリに集約される。
 */
export default function Header() {
  const { currentUser } = useCurrentUser();
  const { logout } = useAuth();

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 1.5,
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <Box
        component={NextLink}
        href="/"
        sx={{
          fontFamily: "var(--font-primary)",
          fontWeight: 700,
          fontSize: 20,
          color: "var(--color-primary)",
        }}
      >
        MemoRise
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography sx={{ fontSize: 14, color: "var(--color-font-secondary)" }}>
          {currentUser.name} さん
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={() => logout()}
          sx={{
            border: "none",
            background: "none",
            p: 0,
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "var(--font-secondary)",
            color: "var(--color-primary)",
          }}
        >
          ログアウト
        </Box>
      </Box>
    </Box>
  );
}
