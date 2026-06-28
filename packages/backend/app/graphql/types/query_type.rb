module Types
  class QueryType < Types::BaseObject
    # ログイン中の一般ユーザー。未認証なら null を返す（フロントはこれで未認証を判定する）。
    field :me, Types::UserType, null: true, description: "ログイン中の一般ユーザー（未認証なら null）"

    # 動作確認用フィールド。
    field :health, String, null: false, description: "API 稼働確認用"

    def me
      context[:current_user]
    end

    def health
      "MemoRise GraphQL API is running"
    end
  end
end
