"use client";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ApolloProvider } from "@apollo/client/react";
import theme from "@/theme/theme";
import { makeApolloClient } from "@/lib/apolloClient";

/**
 * クライアント側のプロバイダをまとめる。
 * - Apollo Client（GraphQL データ取得・キャッシュ）
 * - MUI ThemeProvider + CssBaseline（デザインシステム）
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => makeApolloClient(), []);

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
