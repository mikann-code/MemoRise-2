import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Providers from "./providers";
import "./globals.css";

// 本文フォント（Noto Sans JP）と見出しフォント（Zen Maru Gothic）。
// それぞれ CSS 変数として html に注入し、globals.css の --font-secondary / --font-primary に接続する。
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen-maru-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MemoRise",
  description: "単語暗記学習の継続を支援する Web アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${zenMaruGothic.variable}`}
    >
      <body>
        {/* MUI の SSR スタイル注入（App Router 対応）。 */}
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
