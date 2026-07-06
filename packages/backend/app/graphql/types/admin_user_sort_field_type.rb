module Types
  # ユーザー一覧（管理者専用）の並び替え基準。列名を直接受けず enum で束ねることで、
  # order に渡せる値をホワイトリスト化する（任意カラム指定を防ぐ）。
  class AdminUserSortFieldType < Types::BaseEnum
    graphql_name "AdminUserSortField"

    value "CREATED_AT", "登録日", value: :created_at
    value "WORDS_COUNT", "登録単語数（counter_cache）", value: :words_count
  end
end
