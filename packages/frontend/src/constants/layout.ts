/**
 * レイアウト共通の寸法。Server Component（Layout）と Client Component（Header）の
 * 双方から参照するため、"use client" を持たない素のモジュールに置く。
 * （"use client" モジュールの定数を Server Component へ import すると値ではなく
 *  クライアント参照になり、数値計算が壊れるため。）
 */
export const HEADER_HEIGHT = 56;
