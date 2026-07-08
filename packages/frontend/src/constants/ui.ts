/**
 * UI 共通の定数（ブレークポイント・アニメーション・寸法）。
 * 各所に直書きされていたマジックナンバーを集約する。素のモジュール（"use client" なし）に置き、
 * Server / Client どちらからも値として参照できるようにする（layout.ts と同じ方針）。
 */

/** レスポンシブのモバイル境界。sx のメディアクエリキーに使う（`{ [MOBILE_QUERY]: {...} }`）。 */
export const MOBILE_QUERY = "@media (max-width:768px)";

/** 出入りアニメーションの標準イージングと表示時間（ms）。 */
export const ANIM_EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
export const ANIM_ENTER_MS = 300;

/** スナックバー通知（notify）が自動で消えるまでの表示時間（ms）。 */
export const NOTIFY_DURATION_MS = 1000;

/** ローディング表示コンテナの最小高さ（読み込み中に高さが潰れないよう予約する）。 */
export const LOADING_MIN_HEIGHT = 160;
