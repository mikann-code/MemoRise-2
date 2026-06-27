import type { ReactNode } from "react";

/**
 * (public) グループ：認証不要（/login, /signup）。
 * ヘッダーのナビ等は出さず、画面側（フォーム）が中身を組み立てる素のレイアウト。
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
