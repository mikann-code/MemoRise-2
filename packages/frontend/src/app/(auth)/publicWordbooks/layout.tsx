import type { ReactNode } from "react";
import { ReviewTagProvider } from "@/components/feature/ReviewTagProvider";

/**
 * 公式単語帳（publicWordbooks 配下）の共通レイアウト。
 * 復習タグはバックエンド保存（ReviewTagProvider・taggedWords クエリ）で自作単語帳と共通化する。
 * バックエンドは公式単語帳の単語のタグ付けにも対応済み（base_tagged_word_mutation.rb）。
 * パート解放/進捗もバックエンド保存（wordbookProgresses / completeWordbookProgress）に移したため、
 * 教材トップ（親）が進捗クエリを直接引く。
 */
export default function PublicWordbooksLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ReviewTagProvider>{children}</ReviewTagProvider>;
}
