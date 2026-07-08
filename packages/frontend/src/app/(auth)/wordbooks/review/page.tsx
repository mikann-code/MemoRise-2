"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { WordbookListLayout } from "@/components/layout";
import { SectionTitle, Button, LoadingContainer } from "@/components/common/ui";
import { WordCard, ErrorCard } from "@/components/common/card";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 復習単語一覧（v1 の /wordbooks/review の一覧表示を再現）。
 * ホーム・単語帳一覧の復習バッジはここへ飛び、「今すぐはじめる」で
 * 復習専用テスト（/wordbooks/review/test）へ進む（自作単語帳の 一覧 → テスト と同じ導線）。
 * カードのタグアイコンは登録解除（confirm あり）。外すと一覧からも消える。
 */
export default function ReviewListPage() {
  const { taggedWords, loading, toggleTag } = useReviewTags();
  const { confirm } = useSnackbar();

  // 一覧に並ぶのは全てタグ付き単語なので、トグル = 登録解除（v1 踏襲で confirm を挟む）。
  const handleTagToggle = async (wordId: string) => {
    if (!(await confirm("この単語を復習リストの登録から外しますか？"))) return;
    // 失敗時は表示が変わらないだけなので握りつぶす（再操作できる）。
    await toggleTag(wordId).catch(() => {});
  };

  if (loading && taggedWords.length === 0) {
    return (
      <LoadingContainer />
    );
  }

  return (
    <WordbookListLayout
      header={
        <SectionTitle
          icon={<SellOutlinedIcon />}
          subTitle="Tagged Words for Review"
          title="復習単語"
        />
      }
      description={
        <Box>
          <Typography>タグを付けた単語をまとめて復習できます。</Typography>
          <Typography>登録単語数：{taggedWords.length}語</Typography>
        </Box>
      }
      form={
        <Button
          href="/wordbooks/review/test"
          disabled={taggedWords.length === 0}
          color="#3b82f6"
          hoverColor="#2563eb"
        >
          今すぐはじめる
        </Button>
      }
      list={
        taggedWords.length === 0 ? (
          <ErrorCard
            text={
              <>
                まだ復習単語がありません。
                <br />
                単語一覧やテスト結果から追加できます。
              </>
            }
            buttonLabel="単語帳を見る"
            href="/wordbooks"
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {taggedWords.map((word) => (
              <WordCard
                key={word.id}
                question={word.question}
                answer={word.answer}
                opened
                review
                onTagToggle={() => handleTagToggle(word.id)}
                deletable={false}
              />
            ))}
          </Box>
        )
      }
    />
  );
}
