"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useTaggedWordsQuery } from "@/graphql/queries/taggedWords";
import type { TaggedWordsQuery } from "@/graphql/queries/taggedWords";
import { useAddTaggedWordMutation } from "@/graphql/mutations/addTaggedWord";
import { useRemoveTaggedWordMutation } from "@/graphql/mutations/removeTaggedWord";

/**
 * 復習タグ状態（user_word_tags, tag: "review"）。
 * 旧 WordbookSessionProvider のクライアント一時状態を #10 でバックエンド保存に置き換えたもの。
 * taggedWords クエリを 1 箇所で引き、一覧ページ・テスト・復習専用テスト・件数バッジへ配る。
 * 付け外しは mutation → refetch で反映する（v1 の useTaggedWords + invalidateQueries に相当）。
 * この Provider は wordbooks/layout.tsx に置く。ホームのバッジ（DailyWord）は Provider の外なので
 * 同じ TaggedWords クエリを直接引く（Apollo のキャッシュを共有する）。
 */

type TaggedWord = TaggedWordsQuery["taggedWords"][number];

type ReviewTags = {
  /** 復習タグ付き単語（タグ付けの新しい順）。復習専用テストの出題と件数バッジに使う。 */
  taggedWords: readonly TaggedWord[];
  /** 初回取得中（復習専用テストのローディング表示に使う）。 */
  loading: boolean;
  isTagged: (wordId: string) => boolean;
  /** タグをまとめて付ける（結果画面の「間違えた単語を復習リストに登録」用）。タグ済みはサーバー側が吸収する（冪等）。 */
  addTags: (wordIds: readonly string[]) => Promise<void>;
  /** タグをまとめて外す（復習テスト結果画面の「正解した単語を復習リストから外す」用）。タグ無しはサーバー側が吸収する（冪等）。 */
  removeTags: (wordIds: readonly string[]) => Promise<void>;
  /** タグの付け外し（カードのタグアイコン用）。 */
  toggleTag: (wordId: string) => Promise<void>;
};

const ReviewTagContext = createContext<ReviewTags | null>(null);

const EMPTY_TAGGED_WORDS: readonly TaggedWord[] = [];

export function ReviewTagProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch } = useTaggedWordsQuery();
  const [addTaggedWord] = useAddTaggedWordMutation();
  const [removeTaggedWord] = useRemoveTaggedWordMutation();

  const taggedWords = data?.taggedWords ?? EMPTY_TAGGED_WORDS;

  const taggedIds = useMemo(
    () => new Set(taggedWords.map((w) => w.id)),
    [taggedWords],
  );

  const isTagged = useCallback(
    (wordId: string) => taggedIds.has(wordId),
    [taggedIds],
  );

  const addTags = useCallback(
    async (wordIds: readonly string[]) => {
      await Promise.all(
        wordIds.map((wordId) => addTaggedWord({ variables: { wordId } })),
      );
      await refetch();
    },
    [addTaggedWord, refetch],
  );

  const removeTags = useCallback(
    async (wordIds: readonly string[]) => {
      await Promise.all(
        wordIds.map((wordId) => removeTaggedWord({ variables: { wordId } })),
      );
      await refetch();
    },
    [removeTaggedWord, refetch],
  );

  const toggleTag = useCallback(
    async (wordId: string) => {
      if (taggedIds.has(wordId)) {
        await removeTaggedWord({ variables: { wordId } });
      } else {
        await addTaggedWord({ variables: { wordId } });
      }
      await refetch();
    },
    [taggedIds, addTaggedWord, removeTaggedWord, refetch],
  );

  const value = useMemo(
    () => ({ taggedWords, loading, isTagged, addTags, removeTags, toggleTag }),
    [taggedWords, loading, isTagged, addTags, removeTags, toggleTag],
  );

  return (
    <ReviewTagContext.Provider value={value}>
      {children}
    </ReviewTagContext.Provider>
  );
}

/** wordbooks 配下のページから復習タグ状態を読む。Provider の外で呼ぶと投げる。 */
export function useReviewTags() {
  const ctx = useContext(ReviewTagContext);
  if (!ctx) {
    throw new Error("useReviewTags は ReviewTagProvider の内側で使ってください");
  }
  return ctx;
}
