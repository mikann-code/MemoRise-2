module Mutations
  # 自作（personal）単語帳を扱う一般ユーザー用 Mutation の共通基底。
  # 対象は必ず current_user の personal かつ論理削除前に限定し、
  # 他人・公式の単語帳へ書く事故を構造的に防ぐ（docs/backend.md §4 認可方針）。
  # 認可失敗・対象なし・入力エラーはすべて例外ではなく {success, errors} 方式で返す。
  class BaseMyWordbookMutation < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :wordbook, Types::WordbookType, null: true

    private

    def failure(errors)
      { success: false, errors: errors, wordbook: nil }
    end

    # 未認証。存在確認より先に必ず判定する。
    def unauthorized_errors
      [ { field: "system", message: "認証が必要です" } ]
    end

    # 対象が見つからない（他人・公式・論理削除済みを含む）。
    def not_found_errors
      [ { field: "id", message: "対象の単語帳が見つかりません" } ]
    end

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    # field は GraphQL の入力引数名（camelCase）に合わせる（ValidationErrorType 参照）。
    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end

    # current_user の自作単語帳のみを対象にする（personal / 論理削除前）。
    def find_my_wordbook(id)
      current_user.wordbooks.personal.kept.find_by(id: id)
    end
  end
end
