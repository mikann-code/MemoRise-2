module Resolvers
  # 公式単語帳の管理用一覧（管理者専用）。教材（トップレベル）のみを order_index 昇順で返す。
  # 章（children）・単語（words）は adminWordbook(id) で個別に辿る。論理削除済みは除外する。
  class AdminWordbooks < BaseResolver
    type [ Types::WordbookType ], null: false

    def resolve
      require_admin!

      Wordbook.official.kept.where(parent_id: nil).order(:order_index, :id)
    end
  end
end
