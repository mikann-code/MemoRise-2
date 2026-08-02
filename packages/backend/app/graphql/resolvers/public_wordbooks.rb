module Resolvers
  # 公式単語帳の親一覧（読み取り専用）。
  # 未ログインでは閲覧不可（要件 §2）のため require_user! でガードする。
  # 公式（official）かつ kept（論理削除を除外）かつ published（下書きを除外）の
  # 親（parent_id: nil）のみを返す。
  # 並びは order_index 昇順（管理者が明示した並びを優先）→ 新しく作った順。
  # 教材の order_index は既定で未設定（NULL）なので、実際は追加した教材が先頭に来る。
  # 自作（personal）単語帳はこのクエリからは取得できない（スコープ分離）。
  class PublicWordbooks < BaseResolver
    type [ Types::WordbookType ], null: false

    def resolve
      require_user!

      Wordbook.official.kept.published.where(parent_id: nil).order(:order_index, id: :desc)
    end
  end
end
