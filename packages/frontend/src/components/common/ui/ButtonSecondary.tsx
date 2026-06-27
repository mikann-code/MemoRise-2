"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { styled } from "@mui/material/styles";

/**
 * 従ボタン（青系の立体ボタン）。主ボタン（Button＝オレンジ）に対して対で使う。
 * 構造・挙動は Button と同一で配色だけ青系。
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
  backgroundColor: "#3b82f6",
  boxShadow: "0 4px 0 #173462", // #3b82f6 を 60% 黒混ぜ
  transition: "all .1s ease",
  "&:hover": {
    backgroundColor: "#2563eb",
    transform: "translateY(2px)",
    boxShadow: "0 1px 0 #173462",
  },
  "&:disabled": {
    backgroundColor: "#9ca3af",
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

export default function ButtonSecondary({
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
