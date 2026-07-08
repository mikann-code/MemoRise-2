import { useState } from "react";

/**
 * フォームのサーバーエラーは errors 配列（{field, message}[]）のまま持ち、表示時に field 名で引く。
 * 各フォームで重複していた「fieldError で引く / 入力欄に紐付かない system 系をまとめて出す」ロジックを共通化する。
 * （認証画面の 1 行表示は用途が別なので lib/auth/authError の authErrorMessage を使う）
 */
export type FieldError = { field: string; message: string };

/** errors 配列から該当 field のメッセージを引く（無ければ undefined）。 */
export const pickFieldError = (errors: FieldError[], field: string) =>
  errors.find((e) => e.field === field)?.message;

/**
 * 入力欄に紐付かないエラー（認証失敗の "system"、対象なしの "id" など）を 1 件返す。
 * knownFields は入力欄に対応する field 名。それ以外を「フォーム下にまとめて出す」対象とする。
 */
export const pickSystemError = (errors: FieldError[], knownFields: string[]) =>
  errors.find((e) => !knownFields.includes(e.field))?.message;

/**
 * 単一フォームのエラー state と引き手をまとめて返す。
 * 1 画面に複数フォームがある場合はフォームごとに呼ぶ（add / edit など）。
 */
export function useFieldErrors(knownFields: string[]) {
  const [errors, setErrors] = useState<FieldError[]>([]);
  return {
    errors,
    setErrors,
    fieldError: (field: string) => pickFieldError(errors, field),
    systemError: pickSystemError(errors, knownFields),
  };
}
