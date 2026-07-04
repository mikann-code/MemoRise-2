import type { ReactNode } from "react";
import Box from "@mui/material/Box";

/**
 * (public) グループ：認証不要（/login, /signup）。
 * ヘッダーのナビ等は出さず、画面側（フォーム）が中身を組み立てる素のレイアウト。
 * FormLayout は幅・余白を持たない（width 100%）ため、ヘッダーの無いこのグループでは
 * ここで 560px 中央寄せと縦余白を確保する。
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <Box sx={{ maxWidth: 560, mx: "auto", px: 3, py: 6 }}>{children}</Box>;
}
