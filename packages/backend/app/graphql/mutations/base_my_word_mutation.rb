module Mutations
  # 自作単語帳の単語を扱う一般ユーザー用 Mutation の共通基底。
  # 対象は必ず current_user の単語（所属単語帳が論理削除前のもの）に限定し、
  # 他人・公式の単語へ書く事故を構造的に防ぐ（docs/backend.md §4 認可方針）。
  # 認可失敗・対象なし・入力エラーはすべて例外ではなく {success, errors} 方式で返す。
  class BaseMyWordMutation < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :word, Types::WordType, null: true

    private

    def failure(errors)
      { success: false, errors: errors, word: nil }
    end

    # 未認証。存在確認より先に必ず判定する。
    def unauthorized_errors
      [ { field: "system", message: "認証が必要です" } ]
    end

    # 対象が見つからない（他人・公式・所属単語帳が論理削除済みを含む）。
    def not_found_errors
      [ { field: "id", message: "対象の単語が見つかりません" } ]
    end

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end

    # current_user の単語のみを対象にする。所属単語帳が論理削除済み（ゴミ箱内）の単語は
    # 一覧に出ないため、編集・削除も「見つからない」として扱う。
    def find_my_word(id)
      current_user.words.joins(:wordbook).merge(Wordbook.kept).find_by(words: { id: id })
    end
  end
end
