"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { SectionTitle, LoadingSpinner } from "@/components/common/ui";
import { usePublicWordbooksQuery } from "@/graphql/queries/publicWordbooks";
import { WORDBOOK_LABELS } from "@/constants/wordbookLabels";

type BookItem = { id: string; title: string; level?: string | null };

/** 教材 1 冊の本カード（アイコン + タイトル + レベルのピル）。/basicWord/[id] へ。 */
function BookCard({ item }: { item: BookItem }) {
  return (
    <Box
      component={NextLink}
      href={`/basicWord/${item.id}`}
      sx={{
        flexShrink: 0,
        width: 120,
        height: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        borderRadius: "12px",
        textDecoration: "none",
        color: "inherit",
        transition: "transform .2s ease",
        "&:hover": { transform: "scale(1.08)" },
      }}
    >
      <AutoStoriesOutlinedIcon
        sx={{ fontSize: 56, color: "var(--color-font-secondary)" }}
      />
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </Typography>
      {item.level && (
        <Typography
          sx={{
            fontSize: 12,
            color: "#ffffff",
            backgroundColor: "var(--color-bg-secondary)",
            borderRadius: "999px",
            px: 1.5,
            py: 0.25,
            maxWidth: "80%",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.level}
        </Typography>
      )}
    </Box>
  );
}

/** ラベル 1 セクション（見出しバー + 件数 + 本カードの横棚）。空なら emptyText を出す。 */
function LabelSection({
  title,
  items,
  emptyText,
  barColor = "#4f6cff",
}: {
  title: string;
  items: BookItem[];
  emptyText?: string;
  barColor?: string;
}) {
  return (
    <Box component="section" sx={{ mt: 4.5 }}>
      <Typography
        component="h3"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: 18,
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            width: 4,
            height: 18,
            backgroundColor: barColor,
            borderRadius: "2px",
          }}
        />
        {title}
        <Box component="span" sx={{ fontSize: 13, color: "#888888" }}>
          ({items.length})
        </Box>
      </Typography>

      {items.length === 0 ? (
        emptyText ? (
          <Typography sx={{ fontSize: 13, color: "#777777", ml: 1.5 }}>
            {emptyText}
          </Typography>
        ) : null
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1.5,
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            pb: 1.5,
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "var(--color-bg-tertiary)",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--color-primary)",
              borderRadius: "10px",
            },
          }}
        >
          {items.map((item) => (
            <BookCard key={item.id} item={item} />
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * 公式単語帳の一覧（(auth) グループ・読み取り専用）。
 * ラベル（中学英語 / 英検 / TOEIC …）ごとにセクション分けし、各教材を本カードの横棚で並べる。
 * v1（memorize）の basicWordList の見た目を踏襲する。
 * 既知ラベルに入らない教材（未知ラベル / ラベル無し）は末尾の「未分類」に受け、一覧から消えないようにする。
 */
export default function BasicWordListPage() {
  const { data, loading, error } = usePublicWordbooksQuery();
  const wordbooks = data?.publicWordbooks ?? [];

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
        公式単語帳の取得に失敗しました。
      </Typography>
    );
  }

  // セクションとして描画するラベル値（"none" は一覧に出さない）。
  const shownLabelValues: string[] = WORDBOOK_LABELS.filter(
    (l) => l.value !== "none",
  ).map((l) => l.value);
  // どの既知セクションにも入らない教材（未知ラベル / null / "none"）。
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
        if (label.value === "none") return null;
        const items = wordbooks.filter((wb) => wb.label === label.value);
        return (
          <LabelSection
            key={label.value}
            title={label.label}
            items={items}
            emptyText="このカテゴリの公式単語集は準備中です。"
          />
        );
      })}

      {uncategorized.length > 0 && (
        <LabelSection title="未分類" items={uncategorized} barColor="#888888" />
      )}
    </Box>
  );
}
