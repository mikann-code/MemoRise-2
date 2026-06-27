import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Header from "./Header";
import Footer from "./Footer";

/**
 * アプリの共通シェル。Header（予約枠）+ メイン + 下部固定の Footer ナビ。
 * Route Group の layout から使い、画面側は中身（children）だけを差し込む（Composition）。
 * 下部固定ナビに隠れないよう、メインに下余白を確保する。
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: 4, pb: 14 }}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}
