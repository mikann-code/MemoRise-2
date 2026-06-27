"use client";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ApolloProvider } from "@apollo/client/react";
import theme from "@/theme/theme";
import { makeUserApolloClient } from "@/lib/apolloClient";

/**
 * ルート直下のクライアントプロバイダ。
 * - 一般ユーザー用 Apollo Client（GraphQL データ取得・キャッシュ）
 * - MUI ThemeProvider + CssBaseline（全グループ共通のデザインシステム）
 *
 * 管理者ページ（(admin-user)）では配下で AdminApolloProvider が
 * 管理者用クライアント（admin_token・別キャッシュ）へ差し替える。
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => makeUserApolloClient(), []);

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
