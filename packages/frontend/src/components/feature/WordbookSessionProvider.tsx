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
 * 自作単語帳の復習タグ状態（クライアント一時状態・非永続）。
 * #2 バックエンドには「復習リスト」の保存 API（user_word_tags）がまだ無いため、
 * v1 の UI 挙動（タグの点灯・一覧ヘッダの復習単語カウント）を wordbooks 配下だけで再現する
 * （BasicWordSessionProvider と同じ方針）。
 * この Provider は wordbooks/layout.tsx に置くので、一覧↔単語一覧のページ遷移では状態が保たれ、
 * ブラウザをリロードすると初期化される（＝保存はしない）。
 */
type WordbookSession = {
  /** 復習タグを付けた単語の id 集合。一覧ヘッダの「復習単語 ( n )」に使う。 */
  taggedIds: ReadonlySet<string>;
  toggleTag: (wordId: string) => void;
  isTagged: (wordId: string) => boolean;
};

const WordbookSessionContext = createContext<WordbookSession | null>(null);

export function WordbookSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [taggedIds, setTaggedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

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
    () => ({ taggedIds, toggleTag, isTagged }),
    [taggedIds, toggleTag, isTagged],
  );

  return (
    <WordbookSessionContext.Provider value={value}>
      {children}
    </WordbookSessionContext.Provider>
  );
}

/** wordbooks 配下のページから復習タグ状態を読む。Provider の外で呼ぶと投げる。 */
export function useWordbookSession() {
  const ctx = useContext(WordbookSessionContext);
  if (!ctx) {
    throw new Error(
      "useWordbookSession は WordbookSessionProvider の内側で使ってください",
    );
  }
  return ctx;
}
