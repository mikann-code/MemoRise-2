require "rails_helper"

RSpec.describe Resolvers::StudyRecordsWeek do
  let(:query) do
    <<~GQL
      query($startDate: ISO8601Date!) {
        studyRecordsWeek(startDate: $startDate) {
          id
          studyDate
          studyCount
          studyDetails { id title rate totalCount correctCount }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }

  describe "正常系" do
    it "開始日から 7 日分の記録を日付昇順で返す" do
      create(:study_record, user: user, study_date: Date.new(2026, 7, 12))
      create(:study_record, user: user, study_date: Date.new(2026, 7, 6))

      result = execute_graphql(query, variables: { startDate: "2026-07-06" },
        context: { current_user: user })
      dates = result.dig("data", "studyRecordsWeek").map { |r| r["studyDate"] }

      expect(dates).to eq([ "2026-07-06", "2026-07-12" ])
    end

    it "週境界：開始日と 7 日目は含み、前日と 8 日目は含まない" do
      create(:study_record, user: user, study_date: Date.new(2026, 7, 5))  # 前日
      create(:study_record, user: user, study_date: Date.new(2026, 7, 6))  # 開始日（月曜）
      create(:study_record, user: user, study_date: Date.new(2026, 7, 12)) # 7 日目（日曜）
      create(:study_record, user: user, study_date: Date.new(2026, 7, 13)) # 8 日目

      result = execute_graphql(query, variables: { startDate: "2026-07-06" },
        context: { current_user: user })
      dates = result.dig("data", "studyRecordsWeek").map { |r| r["studyDate"] }

      expect(dates).to eq([ "2026-07-06", "2026-07-12" ])
    end

    it "記録が無い週は空配列を返す" do
      result = execute_graphql(query, variables: { startDate: "2026-01-05" },
        context: { current_user: user })

      expect(result.dig("data", "studyRecordsWeek")).to eq([])
    end
  end

  describe "認可・異常系" do
    it "他人の記録は含めない（current_user スコープ）" do
      create(:study_record, user: create(:user), study_date: Date.new(2026, 7, 8))

      result = execute_graphql(query, variables: { startDate: "2026-07-06" },
        context: { current_user: user })

      expect(result.dig("data", "studyRecordsWeek")).to eq([])
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_graphql(query, variables: { startDate: "2026-07-06" })

      expect(result.dig("data", "studyRecordsWeek")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
