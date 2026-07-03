module Mutations
  # 公式単語帳の削除（管理者専用・論理削除）。親（教材）・子（章）どちらも対象。
  # Wordbook#discard! に合わせて self のみを対象にする（words は残り、undiscard! で復元可能）。
  # 親を削除すると一覧から消え、子（章）は親経由で辿れなくなるため連鎖削除は不要。
  # 削除済み・公式以外（自作）は対象外として not found を返す。
  class DeleteAdminWordbook < BaseAdminWordbookMutation
    argument :id, ID, required: true

    def resolve(id:)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.find_by(id: id)
      return failure(not_found_errors) unless wordbook

      wordbook.discard!

      { success: true, errors: [], wordbook: wordbook }
    end
  end
end
