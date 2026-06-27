"use client";

import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";

export type ButtonProps = MuiButtonProps;

/**
 * 共通ボタン。MUI Button の薄いラッパー。
 * v1 の Button / ButtonSecondary 相当（primary=contained / secondary=outlined を props で切替）。
 * 既定は contained。
 *
 * TODO(design): 共有予定のデザインに合わせて配色・サイズ・角丸・状態（hover/disabled）を確定する。
 */
export default function Button(props: ButtonProps) {
  return <MuiButton variant="contained" {...props} />;
}
