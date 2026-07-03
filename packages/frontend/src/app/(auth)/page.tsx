import Box from "@mui/material/Box";
import {
  DailyWord,
  BasicWord,
  CraftWord,
  WeeklyStreakCard,
} from "@/components/home";

/**
 * ホーム（/）。今日の一問 / 公式単語帳 / オリジナル単語帳 / 週の継続記録の 4 セクションを縦に合成する。
 * (auth) グループ配下に置くので、Header/Footer・幅制約・下部余白・ログインガードは
 * (auth)/layout.tsx（AuthProvider + Layout）に委ねる。各セクションは従来どおり内部で自己完結。
 */
export default function Home() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <DailyWord />
      <BasicWord />
      <CraftWord />
      <WeeklyStreakCard />
    </Box>
  );
}
