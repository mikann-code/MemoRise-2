module Resolvers
  # 公式単語帳の親 1 件（子＝章・単語まで辿れる）。読み取り専用。
  # 未ログインでは閲覧不可（要件 §2）のため require_user! でガードする。
  # 公式（official）かつ kept の親（parent_id: nil）のみが対象。
  # 公式でない / 見つからない場合は null（自作単語帳は公式クエリから取得できない）。
  class PublicWordbook < BaseResolver
    type Types::WordbookType, null: true

    argument :id, ID, required: true

    def resolve(id:)
      require_user!

      Wordbook.official.kept.where(parent_id: nil).find_by(id: id)
    end
  end
end
