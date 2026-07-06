module Mutations
  # 公式単語帳の単語の更新（管理者専用）。渡された引数のみを部分更新する。
  class UpdateAdminWord < BaseAdminWordMutation
    argument :id, ID, required: true
    argument :question, String, required: false
    argument :answer, String, required: false

    def resolve(id:, **attrs)
      return failure(forbidden_errors) unless current_admin

      word = find_official_word(id)
      return failure(not_found_errors) unless word

      word.assign_attributes(attrs)
      return failure(validation_errors(word)) unless word.valid?

      word.save!

      { success: true, errors: [], word: word }
    end
  end
end
