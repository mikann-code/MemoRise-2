"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * 立体ボタン（下方向 box-shadow + hover で translateY(2px) して押し込まれる）。
 * href があれば <Link>、なければ <button> を返す多態。
 * - color / hoverColor：配色。既定はオレンジ（primary → secondary）。
 *   青系（旧 ButtonSecondary）は color="#3b82f6" hoverColor="#2563eb" を指定する。
 *   影の色は color の 40% 黒混ぜ（#ffa94d → #66441f / #3b82f6 → #173462）で自動算出。
 * - width：幅の上書き。既定はフォーム用の 100%（compact は内容サイズ）。
 * - size="compact"：ヘッダ横に並べる内容サイズ版（v1 の .createButton / .reviewButton 系。
 *   768px 以下で padding と文字サイズを縮小）。
 */
type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  color?: string;
  hoverColor?: string;
  width?: number | string;
  size?: "default" | "compact";
};

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  color = "var(--color-primary)",
  hoverColor = "var(--color-secondary)",
  width,
  size = "default",
}: Props) {
  const compact = size === "compact";
  const shadowColor = `color-mix(in srgb, ${color} 40%, black)`;
  const sx: SxProps<Theme> = {
    display: compact ? "inline-flex" : "block",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: width ?? (compact ? "auto" : "100%"),
    p: compact ? "8px 14px" : "4px 0",
    border: "none",
    borderRadius: compact ? "6px" : "4px",
    cursor: "pointer",
    textAlign: "center",
    fontSize: compact ? 14 : 16,
    fontWeight: 500,
    fontFamily: compact ? undefined : "var(--font-secondary)",
    color: "var(--color-font-primary)",
    backgroundColor: color,
    textDecoration: "none",
    boxShadow: `0 4px 0 ${shadowColor}`,
    transition: compact ? "all .2s ease" : "all .1s ease",
    "&:hover": {
      backgroundColor: hoverColor,
      transform: "translateY(2px)",
      boxShadow: `0 1px 0 ${shadowColor}`,
    },
    "&:disabled": {
      backgroundColor: "#cccccc",
      color: "#666666",
      boxShadow: "none",
      cursor: "not-allowed",
    },
    ...(compact && {
      "@media (max-width:768px)": { p: "6px 8px", fontSize: 12 },
    }),
  };

  if (href && !disabled) {
    return (
      <Box component={NextLink} href={href} onClick={onClick} sx={sx}>
        {children}
      </Box>
    );
  }
  return (
    <Box
      component="button"
      type={type}
      onClick={onClick}
      disabled={disabled}
      sx={sx}
    >
      {children}
    </Box>
  );
}
