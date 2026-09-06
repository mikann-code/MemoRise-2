"use client";

import { use } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button, LoadingContainer } from "@/components/common/ui";
import { useMyWordbookQuery } from "@/graphql/queries/myWordbook";
import WordbookTest from "@/components/feature/WordbookTest";
import { ANIM_ENTER_MS, ANIM_EASE_OUT } from "@/constants/ui";

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
          animation: `empty-state-in ${ANIM_ENTER_MS}ms ${ANIM_EASE_OUT} both`,
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
 * 単語を取得して WordbookTest に渡すだけの薄いページ（シャッフルは WordbookTest 側で一度だけ行う）。
 */
export default function WordbookTestPage({ params }: Props) {
  const { id: wordbookId } = use(params);

  const { data, loading, error } = useMyWordbookQuery({
    variables: { id: wordbookId },
  });
  const wordbook = data?.myWordbook ?? null;

  if (loading && !data) {
    return (
      <LoadingContainer />
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

  return (
    <WordbookTest
      wordbookId={wordbookId}
      backHref={`/wordbooks/${wordbookId}/list`}
      words={wordbook.words}
    />
  );
}
