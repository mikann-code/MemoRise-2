module Types
  # 並び順（昇順・降順）。一覧系の並び替え引数で共有する汎用 enum。
  class SortOrderType < Types::BaseEnum
    graphql_name "SortOrder"

    value "ASC", "昇順", value: :asc
    value "DESC", "降順", value: :desc
  end
end
