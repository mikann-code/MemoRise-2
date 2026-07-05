require "rails_helper"

RSpec.describe Resolvers::StudyRecordsRecent do
  let(:query) do
    <<~GQL
      query {
        studyRecordsRecent {
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
    it "新しい日付順で返す" do
      create(:study_record, user: user, study_date: Date.new(2026, 7, 1))
      create(:study_record, user: user, study_date: Date.new(2026, 7, 4))
      create(:study_record, user: user, study_date: Date.new(2026, 7, 2))

      result = execute_graphql(query, context: { current_user: user })
      dates = result.dig("data", "studyRecordsRecent").map { |r| r["studyDate"] }

      expect(dates).to eq([ "2026-07-04", "2026-07-02", "2026-07-01" ])
    end

    it "最大 30 件に制限する" do
      31.times do |i|
        create(:study_record, user: user, study_date: Date.new(2026, 1, 1) + i)
      end

      result = execute_graphql(query, context: { current_user: user })
      records = result.dig("data", "studyRecordsRecent")

      expect(records.size).to eq(30)
      # 31 件中もっとも古い 1 件（1/1）だけが落ちる
      expect(records.last["studyDate"]).to eq("2026-01-02")
    end

    it "記録が無ければ空配列を返す" do
      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "studyRecordsRecent")).to eq([])
    end
  end

  describe "認可・異常系" do
    it "他人の記録は含めない（current_user スコープ）" do
      create(:study_record, user: create(:user))

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "studyRecordsRecent")).to eq([])
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_graphql(query)

      expect(result.dig("data", "studyRecordsRecent")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
