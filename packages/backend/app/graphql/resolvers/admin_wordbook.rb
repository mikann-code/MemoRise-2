module Resolvers
  # 公式単語帳 1 件の管理用取得（管理者専用）。教材（親）・章（子）どちらの id でも引ける。
  # 教材を渡せば children（章）を、章を渡せば words（単語）を辿れる管理導線のため。
  # 公式でない（自作）・論理削除済みは null（存在を教えない）。
  class AdminWordbook < BaseResolver
    type Types::WordbookType, null: true
    argument :id, ID, required: true

    def resolve(id:)
      require_admin!

      Wordbook.official.kept.find_by(id: id)
    end
  end
end
