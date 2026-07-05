module Mutations
  # 単語へ復習タグを付ける。テストの誤答時の自動登録と、一覧・結果画面での手動タグ付けの両方で使う。
  # [user_id, word_id, tag] の UNIQUE があるため find_or_create_by! で吸収し、
  # 既にタグ済みでも成功を返す（冪等。誤答のたびに呼ばれても二重登録しない）。
  class AddTaggedWord < BaseTaggedWordMutation
    argument :word_id, ID, required: true, description: "タグを付ける単語"

    def resolve(word_id:)
      return failure(unauthorized_errors) unless current_user

      word = find_taggable_word(word_id)
      return failure(not_found_errors) unless word

      current_user.user_word_tags.find_or_create_by!(word: word, tag: UserWordTag::REVIEW)

      { success: true, errors: [], word: word }
    end
  end
end
