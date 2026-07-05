module Resolvers
  # 学習記録の週別一覧（週 streak 用）。startDate から 7 日分（startDate 含む）を
  # 日付昇順で返す。週初めの補正（月曜始まり）はクライアント側で行い、ここでは
  # 受け取った開始日からの範囲だけを担う。
  class StudyRecordsWeek < BaseResolver
    type [ Types::StudyRecordType ], null: false

    argument :start_date, GraphQL::Types::ISO8601Date, required: true,
      description: "週の開始日（この日を含む 7 日分を返す）"

    def resolve(start_date:)
      require_user!

      current_user.study_records
                  .includes(:study_details)
                  .where(study_date: start_date..(start_date + 6))
                  .order(:study_date)
    end
  end
end
