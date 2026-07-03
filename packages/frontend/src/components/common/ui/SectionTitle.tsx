import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * セクション見出し。左に円形アイコン枠、右に 2 段見出し（英サブ + 日メイン）。
 * 全画面共通の見出しリズムを作る。
 * icon は MUI アイコン要素（ReactNode）を渡す。
 */
type Props = {
  icon: ReactNode;
  subTitle: string;
  title: string;
};

export default function SectionTitle({ icon, subTitle, title }: Props) {
  return (
    // v1 踏襲：アイコンと 2 段見出しを上揃え（flex-start）で gap 8px、上に 10px の余白。
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: "10px" }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "var(--color-bg-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary)",
          "& svg": { fontSize: 24 },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          component="p"
          sx={{
            fontSize: 13,
            lineHeight: 1.2,
            color: "var(--color-font-secondary)",
          }}
        >
          {subTitle}
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontSize: 22,
            lineHeight: 1.3,
            fontFamily: "var(--font-primary)",
            color: "var(--color-font-primary)",
            "@media (max-width:768px)": { fontSize: 18, lineHeight: 1.2 },
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}
