module Types
  # 管理者ダッシュボードの統計。adminStats Resolver が集計済みの Hash を返す。
  class AdminStatsType < Types::BaseObject
    field :users_count, Integer, null: false, description: "一般ユーザー数（role=user）"
    field :words_count, Integer, null: false, description: "登録単語の総数"
    field :official_wordbooks_count, Integer, null: false,
      description: "公式単語帳の数（論理削除を除く・章を含む）"
    field :personal_wordbooks_count, Integer, null: false,
      description: "自作単語帳の数（論理削除を除く）"
  end
end
