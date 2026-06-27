/**
 * 認証トークンの Cookie 名。
 * 一般ユーザーと管理者で別 Cookie に分け、トークン・キャッシュ空間を分離する
 * （docs/frontend.md「6. 認証・通信」。v1 の user_token / admin_token を踏襲）。
 *
 * NOTE: JWT の発行・Cookie への保存は認証 Issue（#5 / #6）で実装する。
 *       本 Issue では「どの Cookie から読むか」を定義し、
 *       Apollo（authLink）と Route Group のガードが参照する基盤のみを用意する。
 */
export const USER_TOKEN_COOKIE = "user_token";
export const ADMIN_TOKEN_COOKIE = "admin_token";

/**
 * ブラウザ（クライアント）側で Cookie からトークンを読む。
 * バックエンドは Authorization: Bearer <token> ヘッダを見るため、
 * JS から読めるよう httpOnly でない Cookie に保存する想定。
 */
export function readTokenFromBrowser(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
