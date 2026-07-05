require "rails_helper"

RSpec.describe Mutations::CreateStudyRecord do
  let(:mutation) do
    <<~GQL
      mutation CreateStudyRecord($kind: StudyRecordKind!, $totalCount: Int!, $correctCount: Int!, $wordbookId: ID) {
        createStudyRecord(kind: $kind, totalCount: $totalCount, correctCount: $correctCount, wordbookId: $wordbookId) {
          success
          errors { field message }
          studyRecord { id studyDate studyCount }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user, title: "英単語") }

  def execute_create(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "createStudyRecord")
  end

  describe "正常系" do
    it "日次サマリーと詳細を作成し、streak を更新する" do
      expect {
        @data = execute_create(
          { kind: "WORDBOOK", totalCount: 10, correctCount: 8, wordbookId: wordbook.id.to_s }
        )
      }.to change(StudyRecord, :count).by(1).and change(StudyDetail, :count).by(1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(@data.dig("studyRecord", "studyDate")).to eq(Time.zone.today.iso8601)
      expect(@data.dig("studyRecord", "studyCount")).to eq(10)

      detail = StudyDetail.last
      expect(detail.title).to eq("英単語")
      expect(detail.rate).to eq(80)
      expect(detail.total_count).to eq(10)
      expect(detail.correct_count).to eq(8)
      expect(detail.chapter_wordbook_id).to eq(wordbook.id)

      expect(user.reload.streak).to eq(1)
      expect(user.last_study_date).to eq(Time.zone.today)
    end

    it "同じ日の 2 回目は 1 日 1 レコードに集約し、study_count を累積・詳細を追加する" do
      execute_create({ kind: "WORDBOOK", totalCount: 10, correctCount: 8, wordbookId: wordbook.id.to_s })

      expect {
        @data = execute_create(
          { kind: "WORDBOOK", totalCount: 5, correctCount: 5, wordbookId: wordbook.id.to_s }
        )
      }.to change(StudyRecord, :count).by(0).and change(StudyDetail, :count).by(1)

      expect(@data.dig("studyRecord", "studyCount")).to eq(15)
      expect(user.reload.streak).to eq(1) # 同日 2 回でも streak は増えない（冪等）
    end

    it "公式の章は「親タイトル + part」で記録する" do
      parent = create(:wordbook, :official, title: "TOEIC")
      chapter = create(:wordbook, :official, parent: parent, part: "Day 1")

      data = execute_create({ kind: "WORDBOOK", totalCount: 4, correctCount: 2, wordbookId: chapter.id.to_s })

      expect(data["success"]).to be(true)
      expect(StudyDetail.last.title).to eq("TOEIC Day 1")
    end

    it "復習専用テスト（REVIEW）は固定タイトル・単語帳なしで記録する" do
      data = execute_create({ kind: "REVIEW", totalCount: 3, correctCount: 3 })

      expect(data["success"]).to be(true)
      expect(StudyDetail.last.title).to eq("復習テスト")
      expect(StudyDetail.last.chapter_wordbook_id).to be_nil
    end
  end

  describe "異常系" do
    it "REVIEW に wordbookId を指定すると組み合わせ不正で失敗し、作成しない" do
      expect {
        @data = execute_create(
          { kind: "REVIEW", totalCount: 3, correctCount: 3, wordbookId: wordbook.id.to_s }
        )
      }.not_to change(StudyRecord, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "WORDBOOK に wordbookId が無いと組み合わせ不正で失敗し、作成しない" do
      expect {
        @data = execute_create({ kind: "WORDBOOK", totalCount: 3, correctCount: 3 })
      }.not_to change(StudyRecord, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "正答数が出題数を超えるとバリデーションエラーを返し、何も保存しない（トランザクション）" do
      expect {
        @data = execute_create(
          { kind: "WORDBOOK", totalCount: 5, correctCount: 6, wordbookId: wordbook.id.to_s }
        )
      }.to change(StudyRecord, :count).by(0).and change(StudyDetail, :count).by(0)

      expect(@data["success"]).to be(false)
      expect(@data["errors"].map { |e| e["field"] }).to include("correctCount")
      expect(user.reload.streak).to eq(0)
    end

    it "出題数が負ならバリデーションエラーを返し、作成しない" do
      expect {
        @data = execute_create({ kind: "REVIEW", totalCount: -1, correctCount: 0 })
      }.not_to change(StudyRecord, :count)

      expect(@data["success"]).to be(false)
      expect(@data["errors"].map { |e| e["field"] }).to include("totalCount")
    end
  end

  describe "認可" do
    it "他人の単語帳では記録できない（wordbookId エラー）" do
      other_wordbook = create(:wordbook, user: create(:user))

      expect {
        @data = execute_create(
          { kind: "WORDBOOK", totalCount: 1, correctCount: 1, wordbookId: other_wordbook.id.to_s }
        )
      }.not_to change(StudyRecord, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "論理削除済みの単語帳では記録できない（wordbookId エラー）" do
      wordbook.discard!

      data = execute_create({ kind: "WORDBOOK", totalCount: 1, correctCount: 1, wordbookId: wordbook.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "未認証は記録できない（system エラー）" do
      expect {
        @data = execute_create({ kind: "REVIEW", totalCount: 1, correctCount: 1 }, context: {})
      }.not_to change(StudyRecord, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
