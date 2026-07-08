"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import { SectionTitle, LoadingContainer } from "@/components/common/ui";
import { LabelSection } from "@/components/common/card";
import { usePublicWordbooksQuery } from "@/graphql/queries/publicWordbooks";
import { WORDBOOK_LABELS } from "@/constants/wordbookLabels";

/**
 * 公式単語帳の一覧（(auth) グループ・読み取り専用）。
 * ラベル（中学英語 / 英検 / TOEIC …）ごとにセクション分けし、各教材を本カードの横棚で並べる。
 * v1（memorize）の公式単語帳一覧の見た目を踏襲する。
 * 既知ラベルに入らない教材（未知ラベル / ラベル無し）は末尾の「未分類」に受け、一覧から消えないようにする。
 */
export default function PublicWordbooksPage() {
  const { data, loading, error } = usePublicWordbooksQuery();
  const wordbooks = data?.publicWordbooks ?? [];

  if (loading) {
    return (
      <LoadingContainer />
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "var(--color-error)" }}>
        公式単語帳の取得に失敗しました。
      </Typography>
    );
  }

  // セクションとして描画するラベル値。
  const shownLabelValues: string[] = WORDBOOK_LABELS.map((l) => l.value);
  // どの既知セクションにも入らない教材（ラベルなし = null / 未知ラベル）。
  // FE と BE のラベル定義がズレても一覧から消えないための受け皿（出たらデータ側の要確認サイン）。
  const uncategorized = wordbooks.filter(
    (wb) => !shownLabelValues.includes(wb.label ?? ""),
  );

  return (
    <Box sx={{ py: 1 }}>
      <SectionTitle
        icon={<CollectionsBookmarkOutlinedIcon />}
        subTitle="Basic Words"
        title="公式単語集"
      />

      {WORDBOOK_LABELS.map((label) => {
        const items = wordbooks.filter((wb) => wb.label === label.value);
        return (
          <LabelSection
            key={label.value}
            title={label.label}
            items={items}
            hrefFor={(item) => `/publicWordbooks/${item.id}`}
            emptyText="このカテゴリの公式単語集は準備中です。"
          />
        );
      })}

      {uncategorized.length > 0 && (
        <LabelSection
          title="未分類"
          items={uncategorized}
          hrefFor={(item) => `/publicWordbooks/${item.id}`}
          barColor="#888888"
        />
      )}
    </Box>
  );
}
