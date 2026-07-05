module Mutations
  # 復習タグ（user_word_tags, tag: "review"）を扱う一般ユーザー用 Mutation の共通基底。
  # タグ付けの対象は「本人の単語」または「公式単語帳の単語」（いずれも所属単語帳が論理削除前）
  # に限定し、他人の単語へタグを付ける事故を構造的に防ぐ。タグは単語帳横断で扱う（docs/backend.md §2）。
  # 認可失敗・対象なしはすべて例外ではなく {success, errors} 方式で返す。
  class BaseTaggedWordMutation < BaseMutation
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

    # 対象が見つからない（他人の単語・所属単語帳が論理削除済みを含む）。
    def not_found_errors
      [ { field: "wordId", message: "対象の単語が見つかりません" } ]
    end

    # タグ付け可能な単語：本人の単語 or 公式単語帳の単語。所属単語帳が論理削除済み
    # （ゴミ箱内）の単語は一覧に出ないため「見つからない」として扱う。
    def find_taggable_word(id)
      word = Word.joins(:wordbook).merge(Wordbook.kept).find_by(id: id)
      return nil unless word
      return word if word.user_id == current_user.id

      word.wordbook.official? ? word : nil
    end
  end
end
