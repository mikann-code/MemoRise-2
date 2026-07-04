module Mutations
  class UpdateWordbook < BaseMyWordbookMutation
    argument :id, ID, required: true
    argument :title, String, required: false
    argument :description, String, required: false
    argument :label, String, required: false, description: "自由入力。空文字は未設定（null）に戻す"

    def resolve(id:, **attrs)
      return failure(unauthorized_errors) unless current_user

      wordbook = find_my_wordbook(id)
      return failure(not_found_errors) unless wordbook

      # ラベル欄はフォームで空にして保存すると「未設定」に戻す（空文字は保持しない）。（空文字 → nil に正規化する）
      attrs[:label] = attrs[:label].presence if attrs.key?(:label)

      wordbook.assign_attributes(attrs)
      return failure(validation_errors(wordbook)) unless wordbook.valid?

      wordbook.save!

      { success: true, errors: [], wordbook: wordbook }
    end
  end
end
