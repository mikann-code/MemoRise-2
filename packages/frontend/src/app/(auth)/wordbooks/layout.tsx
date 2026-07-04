import type { ReactNode } from "react";
import { WordbookSessionProvider } from "@/components/feature/WordbookSessionProvider";

/**
 * 自作単語帳（wordbooks 配下）の共通レイアウト。
 * 復習タグの一時状態を Provider で配下ページ（一覧 / 単語一覧）へ配る。
 * App Router の layout はページ遷移では再マウントされないため、単語帳をまたいでも状態が保たれる。
 * バックエンド未対応のため保存はせず、リロードで初期化される（basicWord/layout.tsx と同じ方針）。
 */
export default function WordbooksLayout({ children }: { children: ReactNode }) {
  return <WordbookSessionProvider>{children}</WordbookSessionProvider>;
}
