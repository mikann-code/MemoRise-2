module Types
  # 単語帳。公式単語帳の閲覧（親→子→単語）と管理者 CRUD Mutation の戻り値で使う表現。
  # 親 = 教材（TOEIC 等）、子（章）= children、単語 = words。
  class WordbookType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String, null: true
    field :label, String, null: true, description: "junior_high / eiken / toeic / official 等"
    field :level, String, null: true
    field :parent_id, ID, null: true, description: "親（教材）の ID。null なら教材（トップレベル）"
    field :order_index, Integer, null: true, description: "章の並び順"
    field :kind, String, null: false, description: "official / personal / shared"
    field :words_count, Integer, null: false, description: "登録単語数（counter_cache）"
    field :last_studied, GraphQL::Types::ISO8601DateTime, null: true,
      description: "最終学習日時（未学習なら null）"
    field :children, [ Types::WordbookType ], null: false,
      description: "子（章）。論理削除を除外し order_index 昇順"
    field :words, [ Types::WordType ], null: false, description: "この単語帳の単語"

    def children
      object.children.kept.order(:order_index, :id)
    end

    def words
      object.words.order(:id)
    end
  end
end
