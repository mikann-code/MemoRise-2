"use client";

import type { ChangeEvent, ReactNode } from "react";
import { styled } from "@mui/material/styles";

/**
 * フローティングラベル付き入力欄（JS 不要・CSS のみで実現）。
 * placeholder=" " + :placeholder-shown / :focus でラベルを上に浮かせる。
 * autoComplete は既定 off（テスト中の意図しない補完を防止）。error でエラー表示。
 */
// 外側。欄間・エラー文の余白を padding で確保する。ラベル／アイコンの位置基準は
// 内側の Field（高さ = input）なので、ここに padding を足しても中央寄せには影響しない。
// エラー文（絶対配置）はこの padding 領域に収まり、2 行に折り返しても次の欄へ重ならない。
const Wrapper = styled("div")({
  paddingBottom: 24,
  "&.has-error": { paddingBottom: 36 },
});

// 内側。ラベル／アイコン／エラー文の位置基準。in-flow の子は input だけなので
// 高さは常に input と一致し、top:50% の中央寄せがエラー有無で崩れない。
const Field = styled("div")({
  position: "relative",
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
  // エラー文は絶対配置で input の直下に重ねる。Field の高さは input のままなので
  // ラベル／アイコンの中央寄せに影響せず、下の余白（Wrapper の padding）に収まる。
  "& .error-msg": {
    position: "absolute",
    top: "100%",
    left: 4,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.4,
    color: "var(--color-error)",
    wordBreak: "break-word",
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
    <Wrapper className={error ? "has-error" : undefined}>
      <Field>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder=" "
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={error ? "error" : undefined}
          style={icon ? { paddingRight: 40 } : undefined}
        />
        <label htmlFor={id}>
          {labelIcon}
          {label}
        </label>
        {icon && <span className="icon">{icon}</span>}
        {error && (
          <span id={`${id}-error`} className="error-msg">
            {error}
          </span>
        )}
      </Field>
    </Wrapper>
  );
}
