import type { ReactNode } from "react";

/**
 * /admin/* の管理者セグメント。
 * TODO(#6): 管理者ログイン（adminMe）実装後に role=admin の検証＋未認証リダイレクトを入れる。
 *   現状は管理者認証が未実装で、配下に管理者ページもまだ無いためガードは未適用。
 *   旧トークン Cookie 方式（serverAuth/cookies）はセッション方式へ移行済みのため撤去した。
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
