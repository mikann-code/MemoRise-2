"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { LoadingSpinner } from "@/components/common/ui";
import { useAdminStatsQuery } from "@/graphql/queries/adminStats";
import AdminPageHeader from "../_components/AdminPageHeader";

/** 統計（管理者専用）。ユーザー数・単語数・公式/自作単語帳数を集計して表示する。 */
export default function AdminStatsPage() {
  const { data, loading, error } = useAdminStatsQuery();
  const stats = data?.adminStats ?? null;

  const cards = stats
    ? [
        { label: "一般ユーザー数", value: stats.usersCount, icon: <PeopleAltOutlinedIcon /> },
        { label: "登録単語の総数", value: stats.wordsCount, icon: <StickyNote2OutlinedIcon /> },
        { label: "公式単語帳", value: stats.officialWordbooksCount, icon: <PublicOutlinedIcon /> },
        { label: "自作単語帳", value: stats.personalWordbooksCount, icon: <PersonOutlineIcon /> },
      ]
    : [];

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AdminPageHeader title="統計" backHref="/admin" backLabel="管理トップ" />

      {loading && !data ? (
        <Box sx={{ position: "relative", minHeight: 160 }}>
          <LoadingSpinner />
        </Box>
      ) : error ? (
        <Typography sx={{ color: "var(--color-error)" }}>
          統計の取得に失敗しました。
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {cards.map((c) => (
            <Box
              key={c.label}
              sx={{
                background: "#2a2a2a",
                borderRadius: "14px",
                p: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Box sx={{ color: "var(--color-primary)", "& svg": { fontSize: 26 } }}>
                {c.icon}
              </Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>{c.value}</Typography>
              <Typography sx={{ fontSize: 13, color: "#aaaaaa" }}>{c.label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
}
