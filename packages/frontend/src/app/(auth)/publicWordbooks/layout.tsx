import type { ReactNode } from "react";
import { PublicWordbookSessionProvider } from "@/components/feature/PublicWordbookSessionProvider";
import { ReviewTagProvider } from "@/components/feature/ReviewTagProvider";

/**
 * 公式単語帳（publicWordbooks 配下）の共通レイアウト。
 * 復習タグはバックエンド保存（ReviewTagProvider・taggedWords クエリ）で自作単語帳と共通化する。
 * バックエンドは公式単語帳の単語のタグ付けにも対応済み（base_tagged_word_mutation.rb）。
 * 一方、パート解放/進捗はまだ保存 API が無いため PublicWordbookSessionProvider の一時状態で
 * 配下ページ（教材一覧 / 親 / 章の一覧 / テスト）へ配る（リロードで初期化。→ 進捗の永続化は別途）。
 * App Router の layout はページ遷移では再マウントされないため、章をまたいでも状態が保たれる。
 */
export default function PublicWordbooksLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReviewTagProvider>
      <PublicWordbookSessionProvider>{children}</PublicWordbookSessionProvider>
    </ReviewTagProvider>
  );
}
