module Resolvers
  # 直近の学習記録一覧（ダッシュボード用）。新しい日付順に最大 30 件を返す（v1 踏襲）。
  class StudyRecordsRecent < BaseResolver
    RECENT_LIMIT = 30

    type [ Types::StudyRecordType ], null: false

    def resolve
      require_user!

      current_user.study_records
                  .includes(:study_details)
                  .order(study_date: :desc)
                  .limit(RECENT_LIMIT)
    end
  end
end
