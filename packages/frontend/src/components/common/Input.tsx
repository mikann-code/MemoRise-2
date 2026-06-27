"use client";

import MuiTextField, { type TextFieldProps } from "@mui/material/TextField";

export type InputProps = TextFieldProps;

/**
 * 共通入力欄。MUI TextField の薄いラッパー。
 * docs/frontend.md「8.」に従い autoComplete は既定 off（テスト中の意図しない補完を防止）。
 * fullWidth も既定 true。いずれも props で上書き可能。
 *
 * TODO(design): v1 の FloatingInput 相当の見た目（フローティングラベル・角丸）を確定する。
 */
export default function Input(props: InputProps) {
  return <MuiTextField autoComplete="off" fullWidth {...props} />;
}
