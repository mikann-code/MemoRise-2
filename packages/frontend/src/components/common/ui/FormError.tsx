"use client";

import Typography from "@mui/material/Typography";

/**
 * 入力欄に紐付かないフォームエラー（system / id など）をフォーム下にまとめて表示する。
 * 各フォームで重複していた赤字 Typography を集約したもの。message が無ければ何も描画しない。
 */
export default function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Typography sx={{ color: "var(--color-error)", fontSize: 14, mb: 2 }}>
      {message}
    </Typography>
  );
}
