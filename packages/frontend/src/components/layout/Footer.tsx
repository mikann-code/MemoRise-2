"use client";

import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

/**
 * 下部固定のグローバルナビ（ピル形）。usePathname で URL を見て user 用 / admin 用を出し分ける。
 * hover 中はその項目を、未 hover 時は現在ページを active 表示する。
 */
type NavItem = { href: string; label: string; icon: ReactNode };

const USER_NAV: NavItem[] = [
  { href: "/", label: "ホーム", icon: <HomeOutlinedIcon /> },
  { href: "/wordbooks/new", label: "単語作成", icon: <AddCircleOutlineIcon /> },
  { href: "/study-records", label: "学習データ", icon: <BarChartOutlinedIcon /> },
  { href: "/my-page", label: "マイページ", icon: <PersonOutlineIcon /> },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "管理トップ", icon: <DashboardOutlinedIcon /> },
  { href: "/admin/wordbooks", label: "単語帳管理", icon: <MenuBookOutlinedIcon /> },
  { href: "/admin/users", label: "ユーザー一覧", icon: <GroupOutlinedIcon /> },
];

function isCurrent(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Footer() {
  const pathname = usePathname();
  const isAdmin =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin-login");
  const nav = isAdmin ? ADMIN_NAV : USER_NAV;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const currentIndex = nav.findIndex((item) => isCurrent(item.href, pathname));

  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "60px",
        px: 4,
        py: 1.5,
        borderRadius: "52px",
        backgroundColor: "var(--color-bg-primary)",
        boxShadow: "0 4px 20px rgba(0,0,0,.4)",
        zIndex: 999,
        "@media (max-width:1200px)": { gap: "50px" },
        "@media (max-width:768px)": { gap: "30px" },
      }}
    >
      {nav.map((item, i) => {
        const active = hoverIndex !== null ? hoverIndex === i : currentIndex === i;
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
              gap: 0.5,
              textDecoration: "none",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: active ? "#000000" : "var(--color-font-secondary)",
                backgroundColor: active ? "var(--color-primary)" : "transparent",
                boxShadow: active ? "0 2px 6px rgba(0,0,0,.3)" : "none",
                transition: "all .15s ease",
              }}
            >
              {item.icon}
            </Box>
            <Typography
              sx={{
                fontSize: 11,
                color: active
                  ? "var(--color-primary)"
                  : "var(--color-font-secondary)",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
