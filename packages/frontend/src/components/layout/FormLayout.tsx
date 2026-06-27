import type { ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * フォーム画面の共通骨格（Slot 型）。header / description / form を ReactNode で受け取り、
 * ログイン・新規登録などで使い回す（Composition）。
 */
type Props = {
  header: ReactNode;
  description?: ReactNode;
  form: ReactNode;
};

export default function FormLayout({ header, description, form }: Props) {
  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        px: 3,
        py: 6,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box>{header}</Box>
      {description && (
        <Box sx={{ color: "var(--color-font-secondary)" }}>{description}</Box>
      )}
      <Box>{form}</Box>
    </Box>
  );
}
