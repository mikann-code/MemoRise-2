module Mutations
  # 公式単語帳の単語の削除（管理者専用・物理削除）。words_count は counter_cache が減算する。
  class DeleteAdminWord < BaseAdminWordMutation
    argument :id, ID, required: true

    def resolve(id:)
      return failure(forbidden_errors) unless current_admin

      word = find_official_word(id)
      return failure(not_found_errors) unless word

      word.destroy!

      { success: true, errors: [], word: word }
    end
  end
end
