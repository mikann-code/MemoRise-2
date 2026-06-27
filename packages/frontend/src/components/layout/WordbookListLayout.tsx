import type { ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * 単語帳系画面の共通骨格（Slot 型）。見出し + 任意の追加フォーム + 一覧、という構成を受け取る。
 */
type Props = {
  header: ReactNode;
  description?: ReactNode;
  form?: ReactNode;
  list: ReactNode;
};

export default function WordbookListLayout({
  header,
  description,
  form,
  list,
}: Props) {
  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        px: 3,
        py: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box>{header}</Box>
      {description && (
        <Box sx={{ color: "var(--color-font-secondary)" }}>{description}</Box>
      )}
      {form && <Box>{form}</Box>}
      <Box>{list}</Box>
    </Box>
  );
}
