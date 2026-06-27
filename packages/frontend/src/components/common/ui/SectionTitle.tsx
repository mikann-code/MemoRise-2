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
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
          sx={{ fontSize: 13, color: "var(--color-font-secondary)" }}
        >
          {subTitle}
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontSize: 22,
            fontFamily: "var(--font-primary)",
            color: "var(--color-font-primary)",
            "@media (max-width:768px)": { fontSize: 18 },
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}
