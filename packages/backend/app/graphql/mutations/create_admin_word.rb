module Mutations
  # 公式単語帳への単語の追加（管理者専用）。単語は章（子単語帳）にのみ追加できる。
  # 教材（親単語帳）は章の入れ物で単語を直接持たない設計のため、トップレベルへの追加は拒否する。
  # 公式単語は user を持たない（Word#user_consistency）ため user は付けない。
  class CreateAdminWord < BaseAdminWordMutation
    argument :wordbook_id, ID, required: true, description: "追加先の公式単語帳（章のみ）"
    argument :question, String, required: true
    argument :answer, String, required: true

    def resolve(wordbook_id:, question:, answer:)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.find_by(id: wordbook_id)
      return failure(wordbook_not_found_errors) unless wordbook
      return failure(top_level_wordbook_errors) if wordbook.parent_id.nil?

      word = wordbook.words.build(question: question, answer: answer)

      return failure(validation_errors(word)) unless word.valid?

      word.save!

      { success: true, errors: [], word: word }
    end

    private

    def wordbook_not_found_errors
      [ { field: "wordbookId", message: "追加先の公式単語帳が見つかりません" } ]
    end

    def top_level_wordbook_errors
      [ { field: "wordbookId", message: "教材（親単語帳）には単語を追加できません。章を作成して章に追加してください" } ]
    end
  end
end
