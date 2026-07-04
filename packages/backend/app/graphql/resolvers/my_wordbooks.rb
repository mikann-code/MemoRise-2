module Resolvers
  # 自作単語帳の一覧。current_user の personal のみを返し、他人・公式・論理削除済みは
  # スコープで構造的に除外する（user_id 引数は受け取らない。docs/backend.md §4 認可方針）。
  class MyWordbooks < BaseResolver
    type [ Types::WordbookType ], null: false

    def resolve
      require_user!

      current_user.wordbooks.personal.kept.order(:id)
    end
  end
end
