module Mutations
  class CreateWord < BaseMyWordMutation
    argument :wordbook_id, ID, required: true, description: "追加先の自作単語帳"
    argument :question, String, required: true
    argument :answer, String, required: true

    def resolve(wordbook_id:, question:, answer:)
      return failure(unauthorized_errors) unless current_user

      wordbook = current_user.wordbooks.personal.kept.find_by(id: wordbook_id)
      return failure(wordbook_not_found_errors) unless wordbook

      # user は Word の before_validation で単語帳の所有者から引き継がれる。
      word = wordbook.words.build(question: question, answer: answer)

      return failure(validation_errors(word)) unless word.valid?

      word.save!

      { success: true, errors: [], word: word }
    end

    private

    def wordbook_not_found_errors
      [ { field: "wordbookId", message: "追加先の単語帳が見つかりません" } ]
    end
  end
end
