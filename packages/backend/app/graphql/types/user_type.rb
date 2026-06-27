module Types
  # 一般ユーザー。me / 認証 Mutation の戻り値で使う。
  # email・streak 等は本人のみが参照する前提（current_user スコープ）。
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :streak, Integer, null: false, description: "連続学習日数"
    field :last_study_date, GraphQL::Types::ISO8601Date, null: true
    field :words_count, Integer, null: false, description: "登録単語数（counter_cache）"
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
