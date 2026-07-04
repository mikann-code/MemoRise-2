module Mutations
  class DeleteWordbook < BaseMyWordbookMutation
    argument :id, ID, required: true

    def resolve(id:)
      return failure(unauthorized_errors) unless current_user

      wordbook = find_my_wordbook(id)
      return failure(not_found_errors) unless wordbook

      # 論理削除。words は物理削除せず残す（undiscard! で中身ごと復元できる）。
      wordbook.discard!

      { success: true, errors: [], wordbook: wordbook }
    end
  end
end
