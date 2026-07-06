module Mutations
  # 公式単語帳の単語を扱う管理者専用 Mutation の共通基底。
  # 対象は必ず公式（official）かつ論理削除前の単語帳に属する単語に限定し、
  # 誤って自作単語へ書く事故を構造的に防ぐ（docs/backend.md §4 認可方針）。
  # 認可失敗・対象なし・入力エラーはすべて例外ではなく {success, errors} 方式で返す。
  class BaseAdminWordMutation < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :word, Types::WordType, null: true

    private

    def failure(errors)
      { success: false, errors: errors, word: nil }
    end

    # 管理者でない（未認証・一般ユーザーとも）。存在確認より先に必ず判定する。
    def forbidden_errors
      [ { field: "system", message: "権限がありません" } ]
    end

    # 対象が見つからない（自作の単語・所属単語帳が論理削除済みを含む）。
    def not_found_errors
      [ { field: "id", message: "対象の単語が見つかりません" } ]
    end

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end

    # 公式単語帳（論理削除前）に属する単語のみを対象にする。自作・削除済み配下は
    # 「見つからない」として扱う（存在を教えない）。
    def find_official_word(id)
      Word.joins(:wordbook).merge(Wordbook.official.kept).find_by(words: { id: id })
    end
  end
end
