"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button } from "@/components/common/ui";
import { useCurrentAdmin } from "@/lib/auth/adminAuthContext";
import { useAdminAuth } from "@/lib/auth/useAdminAuth";

/**
 * 管理者トップ（/admin）。AdminAuthProvider 配下なので currentAdmin は必ず存在する。
 * 公式単語帳管理・ユーザー一覧・統計への導線を並べる。
 */

const menu = [
  {
    href: "/admin/wordbooks",
    title: "公式単語帳の管理",
    subTitle: "教材・章・単語の作成 / 編集 / 削除・CSV 一括登録",
    icon: <ClassOutlinedIcon />,
  },
  {
    href: "/admin/users",
    title: "ユーザー一覧",
    subTitle: "登録ユーザーの確認",
    icon: <PeopleAltOutlinedIcon />,
  },
  {
    href: "/admin/stats",
    title: "統計",
    subTitle: "ユーザー数・単語数などの集計",
    icon: <InsertChartOutlinedIcon />,
  },
];

const cardSx = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  background: "#2a2a2a",
  borderRadius: "14px",
  p: "18px 20px",
  position: "relative",
  textDecoration: "none",
  color: "#ffffff",
  transition: "transform .15s ease, box-shadow .15s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0,0,0,.35)",
  },
};

export default function AdminHomePage() {
  const { currentAdmin } = useCurrentAdmin();
  const { adminLogout } = useAdminAuth();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700} color="primary">
            管理者ダッシュボード
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currentAdmin.name} さんでログイン中です。
          </Typography>
        </Box>
        <Box sx={{ minWidth: 120 }}>
          <Button type="button" size="compact" onClick={() => void adminLogout()}>
            ログアウト
          </Button>
        </Box>
      </Box>

      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {menu.map((item) => (
          <Box component="li" key={item.href} sx={{ mb: "12px" }}>
            <Box component={NextLink} href={item.href} sx={cardSx}>
              <Box
                sx={{
                  display: "flex",
                  color: "var(--color-primary)",
                  "& svg": { fontSize: 28 },
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 17, fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#aaaaaa", fontSize: 13, mt: "2px" }}>
                  {item.subTitle}
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "#888888" }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
