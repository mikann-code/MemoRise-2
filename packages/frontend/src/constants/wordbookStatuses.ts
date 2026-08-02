/**
 * 公式単語帳（教材）の公開状態（value = Wordbook.status / label = 表示名）。
 * 値の正しさの源泉はバックエンドの Rails enum + GraphQL enum（WordbookStatus）。
 * ここは表示名というプレゼンの関心を持つので、value は BE の enum と一致させる。
 * 管理画面のバッジ表示にのみ使う（一般ユーザーには published しか届かない）。
 */
export const WORDBOOK_STATUSES = [
  { value: "DRAFT", label: "下書き" },
  { value: "PUBLISHED", label: "公開中" },
] as const;

/**
 * status の value を表示名に変換する。未知の値（旧データ等）はそのまま返す。
 * null / 空は null（＝状態表示なし）。
 */
export function statusLabel(value?: string | null): string | null {
  if (!value) return null;
  return WORDBOOK_STATUSES.find((s) => s.value === value)?.label ?? value;
}
