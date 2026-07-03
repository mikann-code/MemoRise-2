"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Button } from "@/components/common/ui";
import { useCurrentAdmin } from "@/lib/auth/adminAuthContext";
import { useAdminAuth } from "@/lib/auth/useAdminAuth";

/**
 * 管理者トップ（/admin）。AdminAuthProvider 配下なので currentAdmin は必ず存在する。
 * 公式単語帳管理・CSV 一括登録・ユーザー一覧・統計などの管理者機能は後続 Issue で追加する。
 */
export default function AdminHomePage() {
  const { currentAdmin } = useCurrentAdmin();
  const { adminLogout } = useAdminAuth();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700} color="primary">
          管理者ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentAdmin.name} さんでログイン中です。
        </Typography>
        <Box sx={{ width: "100%", maxWidth: 240 }}>
          <Button type="button" onClick={() => void adminLogout()}>
            ログアウト
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
