"use client";

import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import CreateIcon from "@mui/icons-material/Create";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MenuBookIcon from "@mui/icons-material/MenuBook";

/**
 * 下部固定のグローバルナビ（幅広のピルバー）。usePathname で URL を見て
 * user 用 / admin 用を出し分ける。項目は常にオレンジ、現在ページ（hover 中はその項目）を
 * 塗り円でハイライトする（v1 踏襲）。
 */
type NavItem = { href: string; label: string; icon: ReactNode };

const USER_NAV: NavItem[] = [
  { href: "/", label: "ホーム", icon: <HomeIcon /> },
  { href: "/wordbooks", label: "単語作成", icon: <CreateIcon /> },
  { href: "/study-records", label: "学習データ", icon: <SchoolIcon /> },
  { href: "/my-page", label: "マイページ", icon: <PersonIcon /> },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "管理トップ", icon: <AdminPanelSettingsIcon /> },
  { href: "/admin/wordbooks", label: "単語帳管理", icon: <MenuBookIcon /> },
  { href: "/admin/users", label: "ユーザー一覧", icon: <PersonIcon /> },
];

export default function Footer() {
  const pathname = usePathname();
  const isAdmin =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin-login");
  const nav = isAdmin ? ADMIN_NAV : USER_NAV;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const currentIndex = nav.findIndex((item) => item.href === pathname);

  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        left: 20,
        right: 20,
        bottom: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "80px",
        py: "4px",
        border: "1px solid #666",
        borderRadius: "52px",
        backgroundColor: "var(--color-bg-primary)",
        zIndex: 999,
        "@media (max-width:1200px)": { gap: "50px" },
        "@media (max-width:768px)": { gap: "30px" },
      }}
    >
      {nav.map((item, i) => {
        const active =
          hoverIndex !== null ? hoverIndex === i : currentIndex === i;
        return (
          <Box
            key={item.href}
            component={NextLink}
            href={item.href}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.25,
              py: 0.5,
              borderRadius: "12px",
              textDecoration: "none",
              color: "var(--color-primary)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .25s ease",
                ...(active
                  ? {
                      backgroundColor: "var(--color-primary)",
                      color: "#000000",
                      boxShadow: "0 2px 8px rgba(255,152,0,.18)",
                    }
                  : {}),
              }}
            >
              {item.icon}
            </Box>
            <Typography sx={{ fontSize: 12, color: "var(--color-primary)" }}>
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
