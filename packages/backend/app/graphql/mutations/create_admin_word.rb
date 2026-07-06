module Mutations
  # 公式単語帳への単語の追加（管理者専用）。教材・章どちらの公式単語帳にも追加できる。
  # 公式単語は user を持たない（Word#user_consistency）ため user は付けない。
  class CreateAdminWord < BaseAdminWordMutation
    argument :wordbook_id, ID, required: true, description: "追加先の公式単語帳（教材・章）"
    argument :question, String, required: true
    argument :answer, String, required: true

    def resolve(wordbook_id:, question:, answer:)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.find_by(id: wordbook_id)
      return failure(wordbook_not_found_errors) unless wordbook

      word = wordbook.words.build(question: question, answer: answer)

      return failure(validation_errors(word)) unless word.valid?

      word.save!

      { success: true, errors: [], word: word }
    end

    private

    def wordbook_not_found_errors
      [ { field: "wordbookId", message: "追加先の公式単語帳が見つかりません" } ]
    end
  end
end
