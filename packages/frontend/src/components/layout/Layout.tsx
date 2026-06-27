import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Header from "./Header";
import Footer from "./Footer";

/**
 * 共通レイアウト。ヘッダー / メイン / フッターの三段組み。
 * Route Group の layout から使い、画面側は中身（children）だけを差し込む（Composition）。
 *
 * TODO(design): 最大幅・余白を共有予定のデザインに合わせて確定する。
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>
      <Footer />
    </Box>
  );
}
