/**
 * 公式単語帳の難易度レベル（value = Wordbook.level / label = 表示名 / 並び順 = このセクション順）。
 * 同じ label（英検 / TOEIC 等）の中で教材を段階分け（基礎 → 標準 → 発展）し、同カテゴリ内で
 * 挑戦度を選び分けるために使う。値の正しさの源泉はバックエンド Wordbook::LEVELS（inclusion で検証）。
 * ここは表示名という プレゼンの関心を持つので、value は BE の LEVELS と一致させる（追加・変更時は両方を揃える）。
 */
export const WORDBOOK_LEVELS = [
  { value: "basic", label: "基礎" },
  { value: "standard", label: "標準" },
  { value: "advanced", label: "発展" },
] as const;

/**
 * level の value を表示名に変換する。未知の値（旧データ等）はそのまま返して一覧から消えないようにする。
 * null / 空は null（＝レベル表示なし）。
 */
export function levelLabel(value?: string | null): string | null {
  if (!value) return null;
  return WORDBOOK_LEVELS.find((l) => l.value === value)?.label ?? value;
}
