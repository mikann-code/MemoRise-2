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
    field :status, Types::WordbookStatusType, null: false,
      description: "公開状態。教材（親）単位で管理者が切り替え、章（子）は親の値を伝播で持つ"
    field :words_count, Integer, null: false, description: "登録単語数（counter_cache）"
    field :last_studied, GraphQL::Types::ISO8601DateTime, null: true,
      description: "最終閲覧日時（単語一覧を開いた時刻。一度も開いていなければ null）"
    field :children, [ Types::WordbookType ], null: false,
      description: "子（章）。論理削除を除外し order_index 昇順"
    field :words, [ Types::WordType ], null: false,
      description: "この単語帳の単語（新しい順）"

    # 公開状態（status）では絞らない。この出口は一般（PublicWordbook）と管理（AdminWordbook）・
    # 管理 Mutation の戻り値で共用しているため、ここで draft を除くと管理画面から章が消える。
    # 一般ユーザーには教材（親）を published で絞ることで到達させない（章は親に追従する）。
    def children
      object.children.kept.order(:order_index, :id)
    end

    # 追加した単語が一覧の先頭に来るよう新しい順で返す（章の children は解放順なので昇順のまま）。
    def words
      object.words.order(id: :desc)
    end
  end
end
