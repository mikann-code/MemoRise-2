/** 認証系ミューテーションの errors 配列要素（{field, message}）。表示・判定に使う共通型。 */
export type AuthFieldError = { field: string; message: string };

/**
 * errors 配列から表示用メッセージを 1 つ取り出す（先頭の message、無ければフォールバック）。
 * サーバーは失敗時に必ず 1 件以上返すが、想定外（空配列など）に備えてフォールバックを持つ。
 */
export function authErrorMessage(
  errors: readonly AuthFieldError[],
  fallback: string,
): string {
  return errors[0]?.message?.trim() || fallback;
}
