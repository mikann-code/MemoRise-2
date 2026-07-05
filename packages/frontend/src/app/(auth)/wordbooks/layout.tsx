import type { ReactNode } from "react";
import { ReviewTagProvider } from "@/components/feature/ReviewTagProvider";

/**
 * 自作単語帳（wordbooks 配下）の共通レイアウト。
 * 復習タグ状態（バックエンド保存・taggedWords クエリ）を Provider で
 * 配下ページ（一覧 / 単語一覧 / テスト / 復習専用テスト）へ配る。
 */
export default function WordbooksLayout({ children }: { children: ReactNode }) {
  return <ReviewTagProvider>{children}</ReviewTagProvider>;
}
