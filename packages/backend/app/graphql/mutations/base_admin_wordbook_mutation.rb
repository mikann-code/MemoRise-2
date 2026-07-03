module Mutations
  # 公式単語帳を扱う管理者専用 Mutation の共通基底。
  # 公式単語帳への書き込みは admin コンテキストでのみ実行可能とし、
  # 誤って公式へ書く事故を構造的に防ぐ（docs/backend.md §4 認可方針）。
  # 認可失敗・対象なし・入力エラーはすべて例外ではなく {success, errors} 方式で返す。
  class BaseAdminWordbookMutation < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :wordbook, Types::WordbookType, null: true

    private

    def failure(errors)
      { success: false, errors: errors, wordbook: nil }
    end

    # 管理者でない（未認証・一般ユーザーとも）。存在確認より先に必ず判定する。
    def forbidden_errors
      [ { field: "system", message: "権限がありません" } ]
    end

    # 対象が見つからない（公式でない・論理削除済みを含む）。
    def not_found_errors
      [ { field: "id", message: "対象の公式単語帳が見つかりません" } ]
    end

    # DB のユニーク制約違反（同一親内の part / order_index 重複）。
    # モデルに uniqueness バリデーションは置いていないため、ここで拾って表示用エラーに変換する。
    def duplicate_errors
      [ { field: "system", message: "同じ親の中で章（part）または並び順（orderIndex）が重複しています" } ]
    end

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    # field は GraphQL の入力引数名（camelCase）に合わせる（ValidationErrorType 参照）。
    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end
  end
end
