"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import StarIcon from "@mui/icons-material/Star";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  SectionTitle,
  LoadingContainer,
  Button,
  EmptyState,
} from "@/components/common/ui";
import { useMyWordbooksQuery } from "@/graphql/queries/myWordbooks";
import { useReviewTags } from "@/components/feature/ReviewTagProvider";
import { MOBILE_QUERY } from "@/constants/ui";
import dayjs from "@/lib/dayjs";

/**
 * 自作単語帳の一覧（v1 の /wordbooks を忠実に再現）。
 * ヘッダ右にアクション 2 つ（復習単語 / ＋ 新しい単語帳）、
 * 下に単語帳カード（左アクセントバー・語数・最終学習・ラベルバッジ・右下矢印）を並べる。
 * 復習単語のカウントはバックエンド保存の実数（taggedWords クエリ）。
 */

const cardSx = {
  display: "flex",
  alignItems: "stretch",
  gap: "12px",
  background: "#2a2a2a",
  borderRadius: "14px",
  p: "14px 16px",
  position: "relative",
  textDecoration: "none",
  color: "#ffffff",
  transition: "transform .15s ease, box-shadow .15s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0,0,0,.35)",
  },
};

const statSx = {
  display: "flex",
  alignItems: "center",
  "& svg": { fontSize: 15, mr: "4px" },
};

export default function WordbooksPage() {
  const { data, loading, error } = useMyWordbooksQuery();
  const { taggedWords } = useReviewTags();
  const wordbooks = data?.myWordbooks ?? [];

  if (loading && !data) {
    return (
      <LoadingContainer />
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "var(--color-error)" }}>
        単語帳の取得に失敗しました。
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "16px",
        }}
      >
        <SectionTitle
          icon={<ClassOutlinedIcon />}
          subTitle="My Wordbooks Collection"
          title="単語帳一覧"
        />

        <Box
          sx={{
            display: "flex",
            gap: "4px",
            [MOBILE_QUERY]: {
              flexDirection: "column",
              mt: "20px",
              gap: "8px",
            },
          }}
        >
          <Button
            href="/wordbooks/review"
            size="compact"
            color="#3b82f6"
            hoverColor="#2563eb"
          >
            <StarIcon sx={{ fontSize: 16 }} />
            復習単語 ( {taggedWords.length} )
          </Button>

          <Button href="/wordbooks/new" size="compact">
            ＋ 新しい単語帳
          </Button>
        </Box>
      </Box>

      {wordbooks.length === 0 && (
        <EmptyState
          icon={<ClassOutlinedIcon />}
          title="単語帳がありません。「 新しい単語帳 」から作成してください。"
        />
      )}

      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {wordbooks.map((wb) => (
          <Box component="li" key={wb.id} sx={{ mb: "12px" }}>
            <Box component={NextLink} href={`/wordbooks/${wb.id}/list`} sx={cardSx}>
              {/* 左アクセントバー */}
              <Box sx={{ width: 6, borderRadius: "8px", background: "#f9a826" }} />

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 600, mb: "4px" }}>
                  {wb.title}
                </Typography>
                <Typography sx={{ color: "#bbbbbb", fontSize: 14 }}>
                  {wb.description}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: "16px",
                    mt: 1,
                    fontSize: 13,
                    color: "#aaaaaa",
                  }}
                >
                  <Box sx={statSx}>
                    <StickyNote2OutlinedIcon /> {wb.wordsCount} words
                  </Box>
                  <Box sx={statSx}>
                    <AccessTimeIcon />
                    {wb.lastStudied ? dayjs(wb.lastStudied).fromNow() : " 未学習"}
                  </Box>
                </Box>
              </Box>

              {wb.label && (
                <Box
                  sx={{
                    background: "#444444",
                    borderRadius: "999px",
                    p: "4px 10px",
                    fontSize: 12,
                    height: "fit-content",
                  }}
                >
                  {wb.label}
                </Box>
              )}

              <ChevronRightIcon
                sx={{
                  fontSize: 22,
                  color: "#888888",
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
