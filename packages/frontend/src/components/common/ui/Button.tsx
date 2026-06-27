"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { styled } from "@mui/material/styles";

/**
 * 主ボタン（オレンジ系の立体ボタン）。
 * href があれば <Link>、なければ <button> を返す多態。
 * 立体表現：下方向 box-shadow + hover で translateY(2px) して押し込まれる（Button 系で共通）。
 */
const rootStyle = {
  display: "block",
  width: "100%",
  padding: "4px 0",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  textAlign: "center" as const,
  fontSize: 16,
  fontWeight: 500,
  fontFamily: "var(--font-secondary)",
  color: "#ffffff",
  backgroundColor: "var(--color-primary)",
  boxShadow: "0 4px 0 #66441f", // primary を 60% 黒混ぜ
  transition: "all .1s ease",
  "&:hover": {
    backgroundColor: "var(--color-secondary)",
    transform: "translateY(2px)",
    boxShadow: "0 1px 0 #66441f",
  },
  "&:disabled": {
    backgroundColor: "#cccccc",
    color: "#666666",
    boxShadow: "none",
    cursor: "not-allowed",
  },
};

const ButtonEl = styled("button")(rootStyle);
const LinkEl = styled(NextLink)(rootStyle);

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
}: Props) {
  if (href && !disabled) {
    return (
      <LinkEl href={href} onClick={onClick}>
        {children}
      </LinkEl>
    );
  }
  return (
    <ButtonEl type={type} onClick={onClick} disabled={disabled}>
      {children}
    </ButtonEl>
  );
}
