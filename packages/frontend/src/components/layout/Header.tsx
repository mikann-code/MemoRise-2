"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useMeQuery } from "@/graphql/queries/me";
import { useAuth } from "@/lib/auth/useAuth";

/**
 * 共通ヘッダー。me を取得し、ログイン中は「名前 + ログアウト」、
 * 未認証なら「ログイン / 新規登録」への導線を出す（未認証時のハンドリング）。
 */
export default function Header() {
  const { data } = useMeQuery({
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { logout } = useAuth();
  const me = data?.me ?? null;

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

      {me ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 14, color: "var(--color-font-secondary)" }}>
            {me.name} さん
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
      ) : (
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box
            component={NextLink}
            href="/login"
            sx={{ fontSize: 14, color: "var(--color-primary)" }}
          >
            ログイン
          </Box>
          <Box
            component={NextLink}
            href="/signup"
            sx={{ fontSize: 14, color: "var(--color-primary)" }}
          >
            新規登録
          </Box>
        </Box>
      )}
    </Box>
  );
}
