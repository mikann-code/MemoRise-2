require "rails_helper"

RSpec.describe Resolvers::StudyRecords do
  let(:query) do
    <<~GQL
      query($year: Int!, $month: Int!) {
        studyRecords(year: $year, month: $month) {
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
    it "指定月の記録を study_details ごと日付昇順で返す" do
      later = create(:study_record, user: user, study_date: Date.new(2026, 7, 20), study_count: 5)
      earlier = create(:study_record, user: user, study_date: Date.new(2026, 7, 3), study_count: 10)
      create(:study_detail, study_record: earlier,
        title: "TOEIC part1", rate: 80, total_count: 10, correct_count: 8)

      result = execute_graphql(query, variables: { year: 2026, month: 7 },
        context: { current_user: user })
      records = result.dig("data", "studyRecords")

      expect(records.map { |r| r["studyDate"] }).to eq([ "2026-07-03", "2026-07-20" ])
      expect(records.first["studyCount"]).to eq(10)
      expect(records.first["studyDetails"]).to eq([ {
        "id" => earlier.study_details.first.id.to_s,
        "title" => "TOEIC part1", "rate" => 80, "totalCount" => 10, "correctCount" => 8
      } ])
      expect(records.second["id"]).to eq(later.id.to_s)
    end

    it "月境界：月初・月末は含み、前月末・翌月頭は含まない" do
      create(:study_record, user: user, study_date: Date.new(2026, 6, 30))
      create(:study_record, user: user, study_date: Date.new(2026, 7, 1))
      create(:study_record, user: user, study_date: Date.new(2026, 7, 31))
      create(:study_record, user: user, study_date: Date.new(2026, 8, 1))

      result = execute_graphql(query, variables: { year: 2026, month: 7 },
        context: { current_user: user })
      dates = result.dig("data", "studyRecords").map { |r| r["studyDate"] }

      expect(dates).to eq([ "2026-07-01", "2026-07-31" ])
    end

    it "記録が無い月は空配列を返す" do
      result = execute_graphql(query, variables: { year: 2026, month: 1 },
        context: { current_user: user })

      expect(result.dig("data", "studyRecords")).to eq([])
    end
  end

  describe "認可・異常系" do
    it "他人の記録は含めない（current_user スコープ）" do
      create(:study_record, user: create(:user), study_date: Date.new(2026, 7, 5))

      result = execute_graphql(query, variables: { year: 2026, month: 7 },
        context: { current_user: user })

      expect(result.dig("data", "studyRecords")).to eq([])
    end

    it "不正な月は BAD_REQUEST" do
      result = execute_graphql(query, variables: { year: 2026, month: 13 },
        context: { current_user: user })

      expect(result.dig("data", "studyRecords")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("BAD_REQUEST")
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_graphql(query, variables: { year: 2026, month: 7 })

      expect(result.dig("data", "studyRecords")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
