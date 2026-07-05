module Resolvers
  # 学習記録の月別一覧（カレンダー用）。current_user の指定月の記録を
  # study_details ごと日付昇順で返す（他人の記録はスコープで構造的に除外する）。
  class StudyRecords < BaseResolver
    type [ Types::StudyRecordType ], null: false

    argument :year, Integer, required: true, description: "対象の年（例 2026）"
    argument :month, Integer, required: true, description: "対象の月（1〜12）"

    def resolve(year:, month:)
      require_user!

      start_date = begin
        Date.new(year, month, 1)
      rescue ArgumentError, RangeError
        raise Errors::BadRequest.new("年月が不正です")
      end

      current_user.study_records
                  .includes(:study_details)
                  .where(study_date: start_date..start_date.end_of_month)
                  .order(:study_date)
    end
  end
end
