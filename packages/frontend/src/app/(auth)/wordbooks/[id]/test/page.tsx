"use client";

import { startTransition, use, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button, LoadingSpinner } from "@/components/common/ui";
import { useMyWordbookQuery } from "@/graphql/queries/myWordbook";
import WordbookTest from "@/components/feature/WordbookTest";

type Word = { id: string; question: string; answer: string };

/** Fisher–Yates で出題順をシャッフルする（元配列は変えない）。 */
function shuffle(words: readonly Word[]): Word[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * テストを開始できないときの案内。スナックバーの確認ダイアログと同じカード見た目
 * （+ 同じ入場アニメーション）で画面中央に表示し、単語帳へ戻るボタンを添える。
 */
function EmptyState({
  message,
  wordbookId,
}: {
  message: string;
  wordbookId: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
      }}
    >
      <Box
        sx={{
          minWidth: 360,
          maxWidth: "calc(100vw - 40px)",
          backgroundColor: "#1f1f1f",
          border: "1px solid var(--color-border)",
          borderRadius: "14px",
          boxShadow: "0 4px 16px rgba(0,0,0,.5)",
          p: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          "@keyframes empty-state-in": {
            from: { opacity: 0, transform: "translateY(24px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
          animation: "empty-state-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <Typography sx={{ fontSize: 16, color: "var(--color-font-primary)" }}>
          {message}
        </Typography>
        <Button href={`/wordbooks/${wordbookId}/list`}>単語帳へ戻る</Button>
      </Box>
    </Box>
  );
}

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * 自作単語帳の単語テスト（v1 の /wordbooks/[id]/test を忠実に再現）。
 * 単語を取得し、シャッフルは startTransition で低優先度化してから WordbookTest に渡す薄いページ。
 */
export default function WordbookTestPage({ params }: Props) {
  const { id: wordbookId } = use(params);

  const { data, loading, error } = useMyWordbookQuery({
    variables: { id: wordbookId },
  });
  const wordbook = data?.myWordbook ?? null;
  const words = wordbook?.words;

  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);

  useEffect(() => {
    if (!words || words.length === 0) return;
    startTransition(() => {
      setShuffledWords(shuffle(words));
    });
  }, [words]);

  if (loading && !data) {
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "var(--color-error)" }}>
        単語の取得に失敗しました。
      </Typography>
    );
  }

  if (!wordbook) {
    return (
      <EmptyState
        message="単語帳が見つかりませんでした。"
        wordbookId={wordbookId}
      />
    );
  }

  if (wordbook.words.length === 0) {
    return <EmptyState message="単語がありません。" wordbookId={wordbookId} />;
  }

  // startTransition の反映待ち（シャッフル前の順で出題しない）
  if (shuffledWords.length === 0) {
    return (
      <Box sx={{ position: "relative", minHeight: 160 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return <WordbookTest wordbookId={wordbookId} words={shuffledWords} />;
}
