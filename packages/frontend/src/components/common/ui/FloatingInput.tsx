"use client";

import type { ChangeEvent, ReactNode } from "react";
import { styled } from "@mui/material/styles";

/**
 * フローティングラベル付き入力欄（JS 不要・CSS のみで実現）。
 * placeholder=" " + :placeholder-shown / :focus でラベルを上に浮かせる。
 * autoComplete は既定 off（テスト中の意図しない補完を防止）。error でエラー表示。
 */
const Wrapper = styled("div")({
  position: "relative",
  marginBottom: 22,
  "& input": {
    width: "100%",
    padding: "10px 12px",
    border: "2px solid var(--color-border)",
    borderRadius: 8,
    background: "transparent",
    color: "var(--color-font-primary)",
    fontSize: 16,
    fontFamily: "var(--font-secondary)",
    outline: "none",
  },
  "& input:focus": { borderColor: "var(--color-font-primary)" },
  "& input.error": { borderColor: "var(--color-error)" },
  "& input:disabled": { opacity: 0.6, cursor: "not-allowed" },
  // ラベル：input の直後（隣接兄弟）に置き、浮いたときは線を背景色で抜く
  "& label": {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "0 4px",
    color: "var(--color-font-secondary)",
    fontSize: 16,
    fontFamily: "var(--font-secondary)",
    pointerEvents: "none",
    background: "var(--color-bg-primary)",
    transition: "all .15s ease",
  },
  // ラベル内アイコンは文字サイズに追従（浮上時 12px → 約 14px。色も label を継承）
  "& label svg": { fontSize: "1.15em" },
  "& input:focus + label, & input:not(:placeholder-shown) + label": {
    top: 0,
    fontSize: 12,
    color: "var(--color-primary)",
  },
  "& .icon": {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    color: "var(--color-font-secondary)",
  },
  "& .error-msg": {
    position: "absolute",
    top: "100%",
    left: 4,
    marginTop: 4,
    fontSize: 12,
    color: "var(--color-error)",
  },
});

type Props = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  icon?: ReactNode;
  labelIcon?: ReactNode;
};

export default function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  error,
  icon,
  labelIcon,
}: Props) {
  return (
    <Wrapper>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder=" "
        autoComplete="off"
        aria-invalid={Boolean(error)}
        className={error ? "error" : undefined}
        style={icon ? { paddingRight: 40 } : undefined}
      />
      <label htmlFor={id}>
        {labelIcon}
        {label}
      </label>
      {icon && <span className="icon">{icon}</span>}
      {error && <span className="error-msg">{error}</span>}
    </Wrapper>
  );
}
