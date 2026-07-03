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
 * 公式単語帳の学習セッション状態（クライアント一時状態・非永続）。
 * #2 バックエンドには「パート解放/進捗」「復習リスト」の保存 API がまだ無いため、
 * v1 の UI 挙動（テスト完了で次の Part を解放・復習タグの点灯）を basicWord 配下だけで再現する。
 * この Provider は basicWord/layout.tsx に置くので、親↔一覧↔テストのページ遷移では状態が保たれ、
 * ブラウザをリロードすると初期化される（＝保存はしない）。
 */
type BasicWordSession = {
  /** テストを完了した章（children）の id 集合。次の Part の解放判定に使う。 */
  completedIds: ReadonlySet<string>;
  markCompleted: (chapterId: string) => void;
  /** 復習タグを付けた単語の id 集合。 */
  taggedIds: ReadonlySet<string>;
  toggleTag: (wordId: string) => void;
  isTagged: (wordId: string) => boolean;
};

const BasicWordSessionContext = createContext<BasicWordSession | null>(null);

export function BasicWordSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [taggedIds, setTaggedIds] = useState<ReadonlySet<string>>(
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

  const toggleTag = useCallback((wordId: string) => {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  }, []);

  const isTagged = useCallback(
    (wordId: string) => taggedIds.has(wordId),
    [taggedIds],
  );

  const value = useMemo(
    () => ({ completedIds, markCompleted, taggedIds, toggleTag, isTagged }),
    [completedIds, markCompleted, taggedIds, toggleTag, isTagged],
  );

  return (
    <BasicWordSessionContext.Provider value={value}>
      {children}
    </BasicWordSessionContext.Provider>
  );
}

/** basicWord 配下のページから学習セッション状態を読む。Provider の外で呼ぶと投げる。 */
export function useBasicWordSession() {
  const ctx = useContext(BasicWordSessionContext);
  if (!ctx) {
    throw new Error(
      "useBasicWordSession は BasicWordSessionProvider の内側で使ってください",
    );
  }
  return ctx;
}
