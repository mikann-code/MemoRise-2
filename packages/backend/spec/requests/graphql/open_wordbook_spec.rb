require "rails_helper"

RSpec.describe Mutations::OpenWordbook do
  let(:mutation) do
    <<~GQL
      mutation OpenWordbook($id: ID!) {
        openWordbook(id: $id) {
          success
          errors { field message }
          wordbook { id lastStudied }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user, title: "開く帳") }

  def execute_open(id, context: { current_user: user })
    execute_graphql(mutation, variables: { id: id.to_s }, context: context)
      .dig("data", "openWordbook")
  end

  describe "正常系" do
    it "最終閲覧日時を現在時刻で記録する" do
      expect {
        @data = execute_open(wordbook.id)
      }.to change { wordbook.reload.last_studied }.from(nil)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(wordbook.last_studied).to be_within(5.seconds).of(Time.current)
    end

    it "何度開いても最新時刻へ上書きする（冪等）" do
      execute_open(wordbook.id)
      wordbook.reload.update_columns(last_studied: 3.days.ago)

      expect {
        execute_open(wordbook.id)
      }.to change { wordbook.reload.last_studied }

      expect(wordbook.last_studied).to be_within(5.seconds).of(Time.current)
    end

    it "単語帳のレコードは増減しない（閲覧の記録だけ）" do
      expect { execute_open(wordbook.id) }.not_to change(Wordbook, :count)
    end
  end

  describe "認可・異常系" do
    it "他人の自作単語帳は開いた記録を付けられない（not found）" do
      other_wordbook = create(:wordbook, user: create(:user))

      data = execute_open(other_wordbook.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(other_wordbook.reload.last_studied).to be_nil
    end

    it "公式（official）単語帳は対象外（not found）" do
      official = create(:wordbook, :official)

      data = execute_open(official.id)

      expect(data["success"]).to be(false)
      expect(official.reload.last_studied).to be_nil
    end

    it "削除済みの単語帳は not found" do
      wordbook.discard!

      data = execute_open(wordbook.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(wordbook.reload.last_studied).to be_nil
    end

    it "未認証は記録できない（system エラー）" do
      data = execute_open(wordbook.id, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.last_studied).to be_nil
    end
  end
end
