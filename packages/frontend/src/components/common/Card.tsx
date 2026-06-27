import MuiCard, { type CardProps } from "@mui/material/Card";

export type { CardProps };

/**
 * 共通カード。MUI Card の薄いラッパー。
 * 汎用 Card / WordCard 等の土台。状態（opened / review / deletable）は
 * 各 feature コンポーネント側で props として載せる（葉は状態を持たない＝状態の hoisting）。
 *
 * TODO(design): 角丸・影・余白を共有予定のデザインに合わせて確定する。
 */
export default function Card(props: CardProps) {
  return <MuiCard {...props} />;
}
