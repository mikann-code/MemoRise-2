"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LoadingSpinner } from "@/components/common/ui";
import { usePublicWordbookChaptersQuery } from "@/graphql/queries/publicWordbookChapters";
import BasicWordTest from "@/components/feature/BasicWordTest";

/**
 * 章（Part）の単語テスト（(auth)）。単語を取得して BasicWordTest に渡すだけの薄いページ。
 * v1（memorize）の basicWord/[parentId]/[childrenId]/test を踏襲。シャッフルは BasicWordTest 側で一度だけ行う。
 */
export default function BasicWordTestPage() {
  const { parentId, childrenId } = useParams<{
    parentId: string;
    childrenId: string;
  }>();
  const { data, loading, error } = usePublicWordbookChaptersQuery({
    variables: { id: parentId },
  });

  const chapter =
    data?.publicWordbook?.children.find((c) => c.id === childrenId) ?? null;
  const words = chapter?.words ?? [];

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

  if (!chapter || words.length === 0) {
    return (
      <Typography sx={{ color: "var(--color-font-secondary)" }}>
        単語がありません。{" "}
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

  return (
    <BasicWordTest
      key={childrenId}
      parentId={parentId}
      chapterId={childrenId}
      words={words}
    />
  );
}
