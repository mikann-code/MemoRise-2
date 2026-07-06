module Types
  # ユーザー一覧（管理者専用）のページング結果。一覧本体（nodes）と絞り込み後の
  # 総件数（totalCount）を束ねて返す。totalCount はページャの総ページ数算出に使う。
  class AdminUsersResultType < Types::BaseObject
    field :nodes, [ Types::UserType ], null: false, description: "現在ページのユーザー一覧"
    field :total_count, Integer, null: false, description: "絞り込み後の総件数（ページ分割前）"
  end
end
