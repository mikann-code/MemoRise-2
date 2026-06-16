module Types
  class QueryType < Types::BaseObject
    # 動作確認用フィールド。実装が進んだら wordbooks / me などに置き換える。
    field :health, String, null: false, description: "API 稼働確認用"

    def health
      "MemoRise GraphQL API is running"
    end
  end
end
