module Mutations
  class UpdateWord < BaseMyWordMutation
    argument :id, ID, required: true
    argument :question, String, required: false
    argument :answer, String, required: false

    def resolve(id:, **attrs)
      return failure(unauthorized_errors) unless current_user

      word = find_my_word(id)
      return failure(not_found_errors) unless word

      word.assign_attributes(attrs)
      return failure(validation_errors(word)) unless word.valid?

      word.save!

      { success: true, errors: [], word: word }
    end
  end
end
