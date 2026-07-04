require "rails_helper"

RSpec.describe Mutations::DeleteWordbook do
  let(:mutation) do
    <<~GQL
      mutation DeleteWordbook($id: ID!) {
        deleteWordbook(id: $id) {
          success
          errors { field message }
          wordbook { id title }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user, title: "消す帳") }

  def execute_delete(id, context: { current_user: user })
    execute_graphql(mutation, variables: { id: id.to_s }, context: context)
      .dig("data", "deleteWordbook")
  end

  describe "正常系" do
    it "論理削除する（レコードは残り deleted_at が入る）" do
      expect {
        @data = execute_delete(wordbook.id)
      }.not_to change(Wordbook, :count)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(wordbook.reload.discarded?).to be(true)
    end

    it "配下の単語は物理削除しない（復元のため）" do
      create(:word, wordbook: wordbook)

      expect { execute_delete(wordbook.id) }.not_to change(Word, :count)
    end
  end

  describe "認可・異常系" do
    it "他人の自作単語帳は削除できない（not found）" do
      other_wordbook = create(:wordbook, user: create(:user))

      data = execute_delete(other_wordbook.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(other_wordbook.reload.discarded?).to be(false)
    end

    it "公式（official）単語帳は削除できない（not found）" do
      official = create(:wordbook, :official)

      data = execute_delete(official.id)

      expect(data["success"]).to be(false)
      expect(official.reload.discarded?).to be(false)
    end

    it "削除済みをもう一度削除すると not found" do
      wordbook.discard!

      data = execute_delete(wordbook.id)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "未認証は削除できない（system エラー）" do
      data = execute_delete(wordbook.id, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.discarded?).to be(false)
    end
  end
end
