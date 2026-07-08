"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { MOBILE_QUERY } from "@/constants/ui";

/**
 * 立体ボタン（下方向 box-shadow + hover で translateY(2px) して押し込まれる）。
 * href があれば <Link>、なければ <button> を返す多態。
 * - variant="danger"：削除など破壊的操作の赤配色（#ef4444 → #dc2626）。color/hoverColor 未指定時の既定。
 * - color / hoverColor：配色の上書き。既定はオレンジ（primary → secondary）。
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
  variant?: "primary" | "danger";
  color?: string;
  hoverColor?: string;
  width?: number | string;
  size?: "default" | "compact";
};

// variant ごとの既定配色。color/hoverColor が明示されればそちらを優先する。
const VARIANT_COLORS = {
  primary: { color: "var(--color-primary)", hoverColor: "var(--color-secondary)" },
  danger: { color: "#ef4444", hoverColor: "#dc2626" },
} as const;

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  color,
  hoverColor,
  width,
  size = "default",
}: Props) {
  const compact = size === "compact";
  const color2 = color ?? VARIANT_COLORS[variant].color;
  const hoverColor2 = hoverColor ?? VARIANT_COLORS[variant].hoverColor;
  const shadowColor = `color-mix(in srgb, ${color2} 40%, black)`;
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
    backgroundColor: color2,
    textDecoration: "none",
    boxShadow: `0 4px 0 ${shadowColor}`,
    transition: compact ? "all .2s ease" : "all .1s ease",
    "&:hover": {
      backgroundColor: hoverColor2,
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
      [MOBILE_QUERY]: { p: "6px 8px", fontSize: 12 },
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
