import type { ReactNode } from "react";
import { BasicWordSessionProvider } from "@/components/feature/BasicWordSessionProvider";

/**
 * 公式単語帳（basicWord 配下）の共通レイアウト。
 * パート解放/進捗・復習タグの一時状態を Provider で配下ページ（親 / 一覧 / テスト）へ配る。
 * App Router の layout はページ遷移では再マウントされないため、章をまたいでも状態が保たれる。
 * バックエンド未対応のため保存はせず、リロードで初期化される。
 */
export default function BasicWordLayout({ children }: { children: ReactNode }) {
  return <BasicWordSessionProvider>{children}</BasicWordSessionProvider>;
}
