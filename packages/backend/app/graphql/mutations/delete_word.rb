module Mutations
  class DeleteWord < BaseMyWordMutation
    argument :id, ID, required: true

    def resolve(id:)
      return failure(unauthorized_errors) unless current_user

      word = find_my_word(id)
      return failure(not_found_errors) unless word

      # 単語は物理削除（単語帳と違い復元要件が無い）。words_count は counter_cache が減算する。
      word.destroy!

      { success: true, errors: [], word: word }
    end
  end
end
