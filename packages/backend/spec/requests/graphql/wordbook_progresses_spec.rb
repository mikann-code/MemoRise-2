require "rails_helper"

RSpec.describe Resolvers::WordbookProgresses do
  let(:query) do
    <<~GQL
      query WordbookProgresses($wordbookId: ID!) {
        wordbookProgresses(wordbookId: $wordbookId) {
          id
          wordbookId
          completed
        }
      }
    GQL
  end

  let(:user) { create(:user) }
  let(:parent) { create(:wordbook, :official, title: "TOEIC") }
  let!(:ch1) { create(:wordbook, :official, parent: parent, order_index: 1) }
  let!(:ch2) { create(:wordbook, :official, parent: parent, order_index: 2) }

  def execute_progresses(id, context: { current_user: user })
    execute_graphql(query, variables: { wordbookId: id.to_s }, context: context)
  end

  describe "正常系（lazy initialization）" do
    it "初回取得で先頭章の進捗を遅延作成し、先頭章だけが解放される" do
      expect {
        @data = execute_progresses(parent.id).dig("data", "wordbookProgresses")
      }.to change(UserWordbookProgress, :count).by(1)

      expect(@data.size).to eq(1)
      expect(@data.first["wordbookId"]).to eq(ch1.id.to_s)
      expect(@data.first["completed"]).to be(false)
    end

    it "2 回目の取得では二重作成しない（冪等）" do
      execute_progresses(parent.id)

      expect { execute_progresses(parent.id) }.not_to change(UserWordbookProgress, :count)
    end

    it "既に解放済みの章はその completed 状態のまま返す" do
      create(:user_wordbook_progress, user: user, wordbook: ch1, completed: true)
      create(:user_wordbook_progress, user: user, wordbook: ch2, completed: false)

      data = execute_progresses(parent.id).dig("data", "wordbookProgresses")
      by_id = data.index_by { |p| p["wordbookId"] }

      expect(by_id[ch1.id.to_s]["completed"]).to be(true)
      expect(by_id[ch2.id.to_s]["completed"]).to be(false)
    end
  end

  describe "認可・スコープ" do
    it "他人の進捗は含めない（current_user スコープ）" do
      other = create(:user)
      create(:user_wordbook_progress, user: other, wordbook: ch1)

      data = execute_progresses(parent.id).dig("data", "wordbookProgresses")

      # 自分の分（遅延作成された先頭章）だけが返る
      expect(data.size).to eq(1)
      expect(UserWordbookProgress.where(user: user).count).to eq(1)
    end

    it "公式でない親では空配列を返し、遅延作成もしない" do
      personal = create(:wordbook, user: user)

      expect {
        @data = execute_progresses(personal.id).dig("data", "wordbookProgresses")
      }.not_to change(UserWordbookProgress, :count)

      expect(@data).to eq([])
    end

    it "論理削除済みの親では空配列を返す" do
      parent.discard!

      data = execute_progresses(parent.id).dig("data", "wordbookProgresses")

      expect(data).to eq([])
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_progresses(parent.id, context: {})

      expect(result.dig("data", "wordbookProgresses")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
