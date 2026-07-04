"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { SectionTitle, LoadingSpinner, Button } from "@/components/common/ui";
import { WordCard } from "@/components/common/card";
import { usePublicWordbookChaptersQuery } from "@/graphql/queries/publicWordbookChapters";
import { useBasicWordSession } from "@/components/feature/BasicWordSessionProvider";
import { useSnackbar } from "@/components/feature/SnackbarProvider";

/**
 * 章（Part）の単語一覧（(auth)・読み取り専用）。全単語を答え開いた状態のカードで並べる。
 * v1（memorize）の basicWord/[parentId]/[childrenId]/list を踏襲。
 * 公式クエリは親しか返さないため親を引いて childrenId の章を取り出す。復習タグは一時状態（保存なし）。
 */
export default function BasicWordListChapterPage() {
  const { parentId, childrenId } = useParams<{
    parentId: string;
    childrenId: string;
  }>();
  const { data, loading, error } = usePublicWordbookChaptersQuery({
    variables: { id: parentId },
  });
  const { isTagged, toggleTag } = useBasicWordSession();
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
          href={`/basicWord/${parentId}`}
          sx={{ color: "var(--color-primary)" }}
        >
          教材トップへ戻る
        </Box>
      </Typography>
    );
  }

  const words = chapter.words;

  // 復習タグの外し操作だけ確認する（v1 踏襲）。付ける操作はそのまま。
  const handleTagToggle = async (wordId: string) => {
    if (
      isTagged(wordId) &&
      !(await confirm("この単語を復習リストから外しますか？"))
    ) {
      return;
    }
    toggleTag(wordId);
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
          <Button href={`/basicWord/${parentId}`}>教材トップに戻る</Button>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Button
            href={`/basicWord/${parentId}/${childrenId}/test`}
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
