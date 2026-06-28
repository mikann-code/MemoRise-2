/** Apollo のエラーから表示用メッセージを取り出す（無ければフォールバック）。 */
export function authErrorMessage(
  error: { message?: string } | undefined | null,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}
