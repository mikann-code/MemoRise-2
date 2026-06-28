"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import { LoadingSpinner } from "@/components/common/ui";
import { useMeQuery } from "@/graphql/queries/me";
import { AuthContext } from "@/lib/auth/authContext";

/**
 * 一般ユーザー必須グループ（(auth)）の認証プロバイダ兼ガード。
 * me を取得し、未認証なら /login へ。認証済みのときだけ currentUser を Context に載せて
 * children を描画するため、配下は useCurrentUser で null チェック不要で参照できる。
 * セッション Cookie はクロスオリジンで Next サーバーから読めないため、
 * Cookie の有無ではなく me クエリの結果で判定する（docs/frontend.md「6. 認証・通信」）。
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, loading, refetch } = useMeQuery({
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });
  const currentUser = data?.me ?? null;

  useEffect(() => {
    if (!loading && !currentUser) router.replace("/login");
  }, [loading, currentUser, router]);

  // 取得中／未認証（リダイレクト確定まで）はローディングを出し、children は描画しない。
  if (loading || !currentUser) {
    return (
      <Box sx={{ position: "relative", minHeight: 240 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, refetch: () => void refetch() }}
    >
      {children}
    </AuthContext.Provider>
  );
}
