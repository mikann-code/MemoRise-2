module Resolvers
  # 管理者ダッシュボードの統計（管理者専用）。件数の集計を 1 クエリにまとめて返す
  # （個別フィールドを都度引くと N 本のクエリになるため、集計専用の型で束ねる）。
  class AdminStats < BaseResolver
    type Types::AdminStatsType, null: false

    def resolve
      require_admin!

      {
        users_count: User.user.count,
        words_count: Word.count,
        official_wordbooks_count: Wordbook.official.kept.count,
        personal_wordbooks_count: Wordbook.personal.kept.count
      }
    end
  end
end
