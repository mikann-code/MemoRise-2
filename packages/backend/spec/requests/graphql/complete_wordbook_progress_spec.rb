require "rails_helper"

RSpec.describe Mutations::CompleteWordbookProgress do
  let(:mutation) do
    <<~GQL
      mutation CompleteWordbookProgress($wordbookId: ID!) {
        completeWordbookProgress(wordbookId: $wordbookId) {
          success
          errors { field message }
          progresses { wordbookId completed }
        }
      }
    GQL
  end

  let(:user) { create(:user) }
  let(:parent) { create(:wordbook, :official, title: "TOEIC") }
  let!(:ch1) { create(:wordbook, :official, parent: parent, order_index: 1) }
  let!(:ch2) { create(:wordbook, :official, parent: parent, order_index: 2) }
  let!(:ch3) { create(:wordbook, :official, parent: parent, order_index: 3) }

  def execute_complete(id, context: { current_user: user })
    execute_graphql(mutation, variables: { wordbookId: id.to_s }, context: context)
      .dig("data", "completeWordbookProgress")
  end

  describe "正常系" do
    it "現在の章を完了し、order_index 昇順で次の章だけを解放する" do
      create(:user_wordbook_progress, user: user, wordbook: ch1) # 先頭は解放済み

      expect {
        @data = execute_complete(ch1.id)
      }.to change(UserWordbookProgress, :count).by(1) # ch2 が解放される

      expect(@data["success"]).to be(true)
      expect(user.user_wordbook_progresses.find_by(wordbook: ch1).completed).to be(true)
      expect(user.user_wordbook_progresses.exists?(wordbook: ch2)).to be(true)
      expect(user.user_wordbook_progresses.exists?(wordbook: ch3)).to be(false)
    end

    it "進捗レコードが無い章でも完了でき（find_or_create）、次章も解放する（+2）" do
      expect {
        execute_complete(ch1.id)
      }.to change(UserWordbookProgress, :count).by(2) # ch1（完了）+ ch2（解放）
    end

    it "最後の章の完了では次章が無いので解放は増えない" do
      create(:user_wordbook_progress, user: user, wordbook: ch3)

      expect {
        @data = execute_complete(ch3.id)
      }.to change(UserWordbookProgress, :count).by(0)

      expect(@data["success"]).to be(true)
      expect(user.user_wordbook_progresses.find_by(wordbook: ch3).completed).to be(true)
    end

    it "再完了は冪等（completed のまま・二重解放しない）" do
      execute_complete(ch1.id) # ch1 完了 + ch2 解放

      expect { execute_complete(ch1.id) }.not_to change(UserWordbookProgress, :count)
    end

    it "更新後の同教材の解放状態を progresses で返す" do
      data = execute_complete(ch1.id)

      ids = data["progresses"].map { |p| p["wordbookId"] }
      expect(ids).to contain_exactly(ch1.id.to_s, ch2.id.to_s)
    end

    it "次章の解放に失敗したら現在章の完了もロールバックする（同一トランザクション）" do
      create(:user_wordbook_progress, user: user, wordbook: ch1)

      # 次章（ch2）の解放時だけ例外を起こし、トランザクションを失敗させる。
      progresses = user.user_wordbook_progresses
      allow(user).to receive(:user_wordbook_progresses).and_return(progresses)
      allow(progresses).to receive(:find_or_create_by!).and_call_original
      allow(progresses).to receive(:find_or_create_by!)
        .with(wordbook_id: ch2.id).and_raise("boom")

      expect { execute_complete(ch1.id) }.to raise_error("boom")

      expect(UserWordbookProgress.find_by(user: user, wordbook: ch1).completed).to be(false)
      expect(UserWordbookProgress.exists?(user: user, wordbook: ch2)).to be(false)
    end
  end

  describe "認可・異常系" do
    it "親（教材そのもの）は完了できない（章のみ対象）" do
      data = execute_complete(parent.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "自作単語帳は完了できない（公式の章のみ）" do
      personal = create(:wordbook, user: user)

      data = execute_complete(personal.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "論理削除済みの章は完了できない" do
      ch1.discard!

      data = execute_complete(ch1.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "下書き（draft）の教材の章は完了できない" do
      ch1.update!(status: :draft)

      expect {
        @data = execute_complete(ch1.id)
      }.not_to change(UserWordbookProgress, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "未認証は完了できない（system エラー）" do
      expect {
        @data = execute_complete(ch1.id, context: {})
      }.not_to change(UserWordbookProgress, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
