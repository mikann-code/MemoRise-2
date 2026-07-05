module Mutations
  # 単語の復習タグを外す。current_user のタグのみが対象で、他人のタグには届かない。
  # タグが無い場合も成功を返す（logout と同じ冪等仕様。二度押しや古い画面からの操作に耐える）。
  class RemoveTaggedWord < BaseTaggedWordMutation
    argument :word_id, ID, required: true, description: "タグを外す単語"

    def resolve(word_id:)
      return failure(unauthorized_errors) unless current_user

      current_user.user_word_tags.find_by(word_id: word_id, tag: UserWordTag::REVIEW)&.destroy!

      { success: true, errors: [], word: nil }
    end
  end
end
