module Resolvers
  # 自作単語帳の一覧。current_user の personal のみを返し、他人・公式・論理削除済みは
  # スコープで構造的に除外する（user_id 引数は受け取らない。docs/backend.md §4 認可方針）。
  # 並びは「最近開いた順」（last_studied = 最終閲覧日時。更新契機は openWordbook）。
  # 未閲覧（last_studied が NULL）は閲覧済みの後ろにまとめ、
  # その中では新しく作った順に並べる（作った単語帳がすぐ見つかるようにする）。
  class MyWordbooks < BaseResolver
    type [ Types::WordbookType ], null: false

    def resolve
      require_user!

      current_user.wordbooks.personal.kept
                  .order(Arel.sql("last_studied DESC NULLS LAST"), id: :desc)
    end
  end
end
