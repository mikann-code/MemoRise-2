module Types
  # 学習記録（1 日 1 レコードの日次サマリー）。createStudyRecord の戻り値と
  # 取得系クエリ（studyRecords / studyRecordsWeek / studyRecordsRecent）で使う。
  class StudyRecordType < Types::BaseObject
    field :id, ID, null: false
    field :study_date, GraphQL::Types::ISO8601Date, null: false
    field :study_count, Integer, null: false, description: "その日に解いた問題数の累積"
    field :study_details, [ Types::StudyDetailType ], null: false,
      description: "その日の個別記録（テストごとの詳細）"
  end
end
