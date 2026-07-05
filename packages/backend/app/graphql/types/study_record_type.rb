module Types
  # 学習記録（1 日 1 レコードの日次サマリー）。createStudyRecord の戻り値で使う。
  # カレンダー・週表示などの取得系クエリは #11 で追加する。
  class StudyRecordType < Types::BaseObject
    field :id, ID, null: false
    field :study_date, GraphQL::Types::ISO8601Date, null: false
    field :study_count, Integer, null: false, description: "その日に解いた問題数の累積"
  end
end
