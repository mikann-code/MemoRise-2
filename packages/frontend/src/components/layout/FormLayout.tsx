import type { ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * フォーム画面の共通骨格（Slot 型）。header / description / form を ReactNode で受け取り、
 * ログイン・新規登録などで使い回す（Composition）。
 * 幅と余白は WordbookListLayout と同じく width 100% で外側のシェルに任せる
 * （(auth) は Layout の main Container、(public)・admin-login は各レイアウト/ページ側）。
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
        width: "100%",
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
