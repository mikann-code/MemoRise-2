"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { SectionTitle, Button, LoadingSpinner } from "@/components/common/ui";
import { useMeQuery } from "@/graphql/queries/me";
import { usePublicWordbooksQuery } from "@/graphql/queries/publicWordbooks";

/**
 * 公式単語帳（ホーム）。未ログイン時はログイン導線カードに差し替え（v1 踏襲）。
 * ログイン時は publicWordbooks を横スクロールのブックカードで並べる。
 */

// 未ログイン時のアクション行（v1 .actionsWrapper と同値）。
const loginActions = {
  width: 500,
  display: "flex",
  gap: 1.25,
  mx: "auto",
  pb: 5,
  "@media (max-width:768px)": { width: 200, flexDirection: "column", gap: 1.75 },
};

const scrollRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1.5,
  mt: 1.5,
  maxWidth: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  pb: 1.5,
  WebkitOverflowScrolling: "touch",
  "&::-webkit-scrollbar": { height: 8 },
  "&::-webkit-scrollbar-track": { background: "#333", borderRadius: "10px" },
  "&::-webkit-scrollbar-thumb": {
    background: "var(--color-primary)",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "var(--color-secondary)",
  },
};

export default function PublicWordbook() {
  const { data: meData, loading: meLoading } = useMeQuery({
    errorPolicy: "all",
  });
  const user = meData?.me ?? null;
  const { data, loading, error } = usePublicWordbooksQuery({ skip: !user });
  const wordbooks = data?.publicWordbooks ?? [];

  const header = (
    <SectionTitle
      icon={<AssignmentOutlinedIcon />}
      subTitle="Vocabulary & Practice"
      title="公式単語帳"
    />
  );

  // me 取得中はちらつき防止のため描画しない。
  if (meLoading) return null;

  if (!user) {
    return (
      <Box component="section">
        <Box sx={{ mb: 2 }}>{header}</Box>
        <Box
          sx={{
            border: "2px solid var(--color-border)",
            borderRadius: "12px",
            mt: 2.5,
          }}
        >
          <Typography sx={{ color: "#ccc", textAlign: "center", p: 2.5 }}>
            公式単語帳を見るにはログインが必要です
          </Typography>
          <Box sx={loginActions}>
            <Button href="/login">ログインする</Button>
            <Button href="/signup" color="#3b82f6" hoverColor="#2563eb">
              新規登録
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="section">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {header}
        <Button href="/publicWordbooks" size="compact">
          <FormatListBulletedIcon sx={{ fontSize: 16 }} /> 一覧を見る
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ position: "relative", minHeight: 120 }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Typography sx={{ color: "var(--color-error)" }}>
          取得に失敗しました
        </Typography>
      ) : wordbooks.length === 0 ? (
        <Typography sx={{ color: "var(--color-font-secondary)" }}>
          単語帳がありません
        </Typography>
      ) : (
        <Box sx={scrollRow}>
          {wordbooks.map((item) => (
            <Box
              key={item.id}
              component={NextLink}
              href={`/publicWordbooks/${item.id}`}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
                textDecoration: "none",
                color: "var(--color-font-primary)",
              }}
            >
              <MenuBookOutlinedIcon
                sx={{
                  fontSize: 150,
                  transition: "transform .3s ease",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              />
              <Typography sx={{ fontSize: 14, textAlign: "center" }}>
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
                    py: 0.5,
                    width: "70%",
                    textAlign: "center",
                  }}
                >
                  {item.level}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
