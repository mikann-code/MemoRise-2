"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { SectionTitle, LoadingSpinner, Button } from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { usePublicWordbookChaptersQuery } from "@/graphql/queries/publicWordbookChapters";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 章（Part）の単語一覧（(auth)・読み取り専用）。全単語を答え開いた状態のカードで並べる。
 * v1（memorize）の公式単語帳の章の単語一覧を踏襲。
 * 公式クエリは親しか返さないため親を引いて childrenId の章を取り出す。
 * 復習タグはバックエンド保存（ReviewTagProvider）で自作単語帳の一覧と共通の挙動。
 */
export default function PublicWordbookListChapterPage() {
  const { parentId, childrenId } = useParams<{
    parentId: string;
    childrenId: string;
  }>();
  const { data, loading, error } = usePublicWordbookChaptersQuery({
    variables: { id: parentId },
  });
  const { isTagged, toggleTag } = useReviewTags();
  const { confirm } = useSnackbar();

  const chapter =
    data?.publicWordbook?.children.find((c) => c.id === childrenId) ?? null;

  if (loading) {
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

  if (!chapter) {
    return (
      <Typography sx={{ color: "var(--color-font-secondary)" }}>
        単語帳が見つかりませんでした。{" "}
        <Box
          component={NextLink}
          href={`/publicWordbooks/${parentId}`}
          sx={{ color: "var(--color-primary)" }}
        >
          教材トップへ戻る
        </Box>
      </Typography>
    );
  }

  const words = chapter.words;

  // 復習タグは付け外しの両方向とも確認する（自作単語帳の一覧と同じ。付ける側は
  // mutation → refetch の反映待ちで一瞬未登録に見えるため、confirm で操作の成立を明示する）。
  const handleTagToggle = async (wordId: string) => {
    const message = isTagged(wordId)
      ? "この単語を復習リストの登録から外しますか？"
      : "この単語を復習リストに登録しますか？";
    if (!(await confirm(message))) return;
    // 失敗時は表示が変わらないだけなので握りつぶす（再操作できる）。
    await toggleTag(wordId).catch(() => {});
  };

  return (
    <Box>
      <SectionTitle
        icon={<FormatListBulletedIcon />}
        subTitle="Words List"
        title={chapter.title}
      />

      <Box sx={{ color: "var(--color-font-secondary)", mt: 1.25 }}>
        {chapter.description && <Typography>{chapter.description}</Typography>}
        <Typography>登録単語数：{words.length}</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: "10px", m: "4px 0 20px" }}>
        <Box sx={{ flex: 1 }}>
          <Button href={`/publicWordbooks/${parentId}`}>教材トップに戻る</Button>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Button
            href={`/publicWordbooks/${parentId}/${childrenId}/test`}
            color="#3b82f6"
            hoverColor="#2563eb"
          >
            今すぐはじめる
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {words.map((word) => (
          <WordCard
            key={word.id}
            question={word.question}
            answer={word.answer}
            opened
            review={isTagged(word.id)}
            onTagToggle={() => handleTagToggle(word.id)}
            deletable={false}
          />
        ))}
      </Box>
    </Box>
  );
}
