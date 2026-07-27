import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import { SectionTitle } from "@/components/common/ui";
import { ErrorCard } from "@/components/common/card";

/**
 * 404 ページ（App Router の not-found）。存在しない URL と `notFound()` の両方がここに来る。
 * ルート直下なので (auth) グループの共通シェル（Header / Footer）は付かない
 * （未ログインでも表示されるページなので、me を引く Header は載せられない）。
 * 代わりに Layout と同じ Container 幅で揃え、空状態と同じ SectionTitle + ErrorCard で
 * 「見つからない」ことと戻り導線を示す。
 */

export const metadata: Metadata = {
  title: "ページが見つかりません | MemoRise",
};

export default function NotFound() {
  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 8,
      }}
    >
      {/* 見出し・404・カードを ErrorCard と同じ幅の枠（600px・中央寄せ）に収め、左右の端を揃える。 */}
      <Box sx={{ width: "100%", maxWidth: 600, mx: "auto" }}>
        <SectionTitle
          icon={<SearchOffOutlinedIcon />}
          subTitle="Not Found"
          title="ページが見つかりません"
        />

        <Box sx={{ mt: 3 }}>
          <ErrorCard
            text={
              <>
                お探しのページは見つかりませんでした。
                <br />
                URL が変わったか、削除された可能性があります。
              </>
            }
            buttonLabel="ホームへ戻る"
            href="/"
            secondaryButtonLabel="単語帳一覧へ"
            secondaryHref="/wordbooks"
          />
        </Box>
      </Box>
    </Container>
  );
}
