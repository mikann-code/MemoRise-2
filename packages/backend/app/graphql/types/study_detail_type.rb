module Types
  # 学習記録の詳細（1 回のテストに対応する個別記録）。study_records 配下でのみ返す。
  class StudyDetailType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: true, description: "学習した単語帳の表示名（復習テストは固定名）"
    field :rate, Integer, null: false, description: "正答率（%・四捨五入）"
    field :total_count, Integer, null: false, description: "出題数"
    field :correct_count, Integer, null: false, description: "正答数"
  end
end
