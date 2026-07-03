/**
 * 「今日の一問」API 未取得時に表示するフォールバック単語（v1 踏襲）。
 * DailyWord がマウント時に 1 件だけ抽選し、初回ロードの空白を防ぐ。
 */
export const fallbackWords = [
  { question: "let", answer: "Oに～させる" },
  { question: "create", answer: "(を)つくり出す" },
  { question: "cause", answer: "を引き起こす" },
  { question: "increase", answer: "増加する" },
  { question: "leave", answer: "OをCのままにしておく" },
  { question: "develop", answer: "を開発する" },
  { question: "reduce", answer: "を減らす" },
  { question: "improve", answer: "を進歩[向上]させる" },
  { question: "produce", answer: "(製品・農作物など)を作る" },
  { question: "agree", answer: "意見が一致する" },
  { question: "tell", answer: "がわかる" },
  { question: "allow", answer: "を許す" },
  { question: "prepare", answer: "(を)準備する" },
  { question: "own", answer: "を所有している" },
  { question: "check", answer: "(を)検査[点検]する" },
  { question: "suggest", answer: "を提案する" },
  { question: "cost", answer: "(費用)がかかる" },
  { question: "meet", answer: "(要求・条件など)を満たす" },
  { question: "provide", answer: "を提供[供給]する" },
  { question: "waste", answer: "を浪費する" },
] as const;
