"use client";

import { useMemo } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { makeAdminApolloClient } from "@/lib/apolloClient";

/**
 * 管理者ページ専用の Apollo Provider。
 * ルートの一般ユーザー用クライアントを、配下の管理者ページでだけ
 * 管理者用クライアント（admin_token・別キャッシュ空間）に差し替える。
 */
export default function AdminApolloProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useMemo(() => makeAdminApolloClient(), []);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
