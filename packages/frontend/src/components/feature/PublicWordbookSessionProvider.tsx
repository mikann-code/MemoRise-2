"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

/**
 * 公式単語帳の「パート解放/進捗」状態（クライアント一時状態・非永続）。
 * 復習タグはバックエンド保存（ReviewTagProvider）に移したため、ここは進捗解放だけを持つ。
 * #2 バックエンドには「パート解放/進捗」の保存 API がまだ無いため、
 * v1 の UI 挙動（テスト完了で次の Part を解放）を publicWordbooks 配下だけで再現する。
 * この Provider は publicWordbooks/layout.tsx に置くので、親↔一覧↔テストのページ遷移では状態が保たれ、
 * ブラウザをリロードすると初期化される（＝保存はしない）。
 */
type PublicWordbookSession = {
  /** テストを完了した章（children）の id 集合。次の Part の解放判定に使う。 */
  completedIds: ReadonlySet<string>;
  markCompleted: (chapterId: string) => void;
};

const PublicWordbookSessionContext =
  createContext<PublicWordbookSession | null>(null);

export function PublicWordbookSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const markCompleted = useCallback((chapterId: string) => {
    setCompletedIds((prev) => {
      if (prev.has(chapterId)) return prev;
      const next = new Set(prev);
      next.add(chapterId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ completedIds, markCompleted }),
    [completedIds, markCompleted],
  );

  return (
    <PublicWordbookSessionContext.Provider value={value}>
      {children}
    </PublicWordbookSessionContext.Provider>
  );
}

/** publicWordbooks 配下のページから学習セッション状態を読む。Provider の外で呼ぶと投げる。 */
export function usePublicWordbookSession() {
  const ctx = useContext(PublicWordbookSessionContext);
  if (!ctx) {
    throw new Error(
      "usePublicWordbookSession は PublicWordbookSessionProvider の内側で使ってください",
    );
  }
  return ctx;
}
