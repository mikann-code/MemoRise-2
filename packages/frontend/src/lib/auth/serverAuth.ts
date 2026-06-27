import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_TOKEN_COOKIE, USER_TOKEN_COOKIE } from "@/lib/auth/cookies";

/**
 * サーバーコンポーネント（Route Group の layout）で使う認証ガード。
 * next/headers を使うためサーバー専用（クライアントからは import しない）。
 *
 * NOTE: 現状はトークン Cookie の有無で判定する基盤実装。
 *       me / adminMe クエリによる本検証・role 整合チェックは
 *       認証 Issue（#5 / #6）で差し替える。
 */
export async function getUserToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(USER_TOKEN_COOKIE)?.value ?? null;
}

export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

/** 一般ユーザー必須グループ（(auth)）のガード。未ログインなら /login へ。 */
export async function requireUser(): Promise<void> {
  if (!(await getUserToken())) redirect("/login");
}

/** 管理者必須セグメント（/admin/*）のガード。未ログインなら /admin-login へ。 */
export async function requireAdmin(): Promise<void> {
  if (!(await getAdminToken())) redirect("/admin-login");
}
