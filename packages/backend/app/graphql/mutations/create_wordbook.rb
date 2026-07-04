module Mutations
  class CreateWordbook < BaseMyWordbookMutation
    argument :title, String, required: true
    argument :description, String, required: false
    argument :label, String, required: false, description: "自由入力（例: 英語 / IT / TOEIC）"

    def resolve(title:, description: nil, label: nil)
      return failure(unauthorized_errors) unless current_user

      wordbook = current_user.wordbooks.build(
        title: title,
        description: description,
        label: label.presence,
        kind: :personal
      )

      return failure(validation_errors(wordbook)) unless wordbook.valid?

      wordbook.save!

      { success: true, errors: [], wordbook: wordbook }
    end
  end
end
