"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import { LoadingSpinner } from "@/components/common/ui";
import { useAdminMeQuery } from "@/graphql/queries/adminMe";
import { AdminAuthContext } from "@/lib/auth/adminAuthContext";

/**
 * 管理者必須セグメント（/admin/*）の認証プロバイダ兼ガード。
 * adminMe を取得し、管理者でなければ（role 不一致・未認証とも adminMe が null）/admin-login へ。
 * 認証済みのときだけ currentAdmin を Context に載せて children を描画するため、
 * 配下は useCurrentAdmin で null チェック不要で参照できる。
 * セッション Cookie はクロスオリジンで Next サーバーから読めないため、
 * Cookie の有無ではなく adminMe クエリの結果で判定する（一般側 AuthProvider と同方針）。
 */
export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, loading, refetch } = useAdminMeQuery({
    fetchPolicy: "network-only",
    errorPolicy: "all",
  });
  const currentAdmin = data?.adminMe ?? null;

  useEffect(() => {
    if (!loading && !currentAdmin) router.replace("/admin-login");
  }, [loading, currentAdmin, router]);

  // 取得中／未認証（リダイレクト確定まで）はローディングを出し、children は描画しない。
  if (loading || !currentAdmin) {
    return (
      <Box sx={{ position: "relative", minHeight: 240 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <AdminAuthContext.Provider
      value={{ currentAdmin, refetch: () => void refetch() }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
