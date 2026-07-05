/**
 * 公式単語帳のラベル分類（value = Wordbook.label / label = 表示名 / 並び順 = このセクション順）。
 * 値の正しさの源泉はバックエンド Wordbook::LABELS（inclusion で検証）。ここは表示名と並び順という
 * プレゼンの関心を持つので、value は BE の LABELS と一致させる（追加・変更時は両方を揃える）。
 * 公式単語帳の一覧（publicWordbooks）ではこの並び順どおりにセクション分けして教材を並べる。
 * "none"（ラベルなし）は公式一覧には出さないので、描画側でスキップする。
 */
export const WORDBOOK_LABELS = [
  { value: "none", label: "ラベルなし" },
  { value: "junior_high", label: "中学英語" },
  { value: "high_school", label: "高校英語" },
  { value: "eiken", label: "英検" },
  { value: "toeic", label: "TOEIC" },
  { value: "toefl", label: "TOEFL" },
  { value: "daily", label: "日常英会話" },
  { value: "official", label: "公式" },
] as const;
