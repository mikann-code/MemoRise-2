"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { levelLabel } from "@/constants/wordbookLevels";

export type ShelfBookItem = { id: string; title: string; level?: string | null };

/** 教材 1 冊の本カード（アイコン + タイトル + レベルのピル）。href 先の詳細へ遷移する。 */
export function BookCard({
  item,
  href,
}: {
  item: ShelfBookItem;
  href: string;
}) {
  return (
    <Box
      component={NextLink}
      href={href}
      sx={{
        flexShrink: 0,
        width: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 0.75,
        py: 1,
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
          // タイトルの行数差でアイコン・レベルタグが上下にズレないよう常に 2 行分を確保する。
          height: "2.6em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
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
          {levelLabel(item.level)}
        </Typography>
      )}
    </Box>
  );
}

/**
 * ラベル 1 セクション（見出しバー + 件数 + 本カードの横棚）。空なら emptyText を出す。
 * 各カードの遷移先は hrefFor(item) で組み立てる（一般ユーザー = 学習画面 / 管理者 = 管理画面）。
 */
export function LabelSection({
  title,
  items,
  hrefFor,
  emptyText,
  barColor = "#4f6cff",
}: {
  title: string;
  items: ShelfBookItem[];
  hrefFor: (item: ShelfBookItem) => string;
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
            alignItems: "flex-start",
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
            <BookCard key={item.id} item={item} href={hrefFor(item)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
