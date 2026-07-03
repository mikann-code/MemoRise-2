module Resolvers
  # 公式単語帳の親一覧（読み取り専用）。
  # 未ログインでは閲覧不可（要件 §2）のため require_user! でガードする。
  # 公式（official）かつ kept（論理削除を除外）の親（parent_id: nil）のみを order_index 昇順で返す。
  # 自作（personal）単語帳はこのクエリからは取得できない（スコープ分離）。
  class PublicWordbooks < BaseResolver
    type [ Types::WordbookType ], null: false

    def resolve
      require_user!

      Wordbook.official.kept.where(parent_id: nil).order(:order_index, :id)
    end
  end
end
