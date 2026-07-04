require "rails_helper"

RSpec.describe Mutations::DeleteWord do
  let(:mutation) do
    <<~GQL
      mutation DeleteWord($id: ID!) {
        deleteWord(id: $id) {
          success
          errors { field message }
          word { id question }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user) }
  let!(:word) { create(:word, wordbook: wordbook) }

  def execute_delete(id, context: { current_user: user })
    execute_graphql(mutation, variables: { id: id.to_s }, context: context)
      .dig("data", "deleteWord")
  end

  describe "正常系" do
    it "単語を物理削除する" do
      expect {
        @data = execute_delete(word.id)
      }.to change(Word, :count).by(-1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(Word.exists?(word.id)).to be(false)
    end

    it "words_count（counter_cache）が単語帳・ユーザーとも減る" do
      expect(wordbook.reload.words_count).to eq(1)

      execute_delete(word.id)

      expect(wordbook.reload.words_count).to eq(0)
      expect(user.reload.words_count).to eq(0)
    end
  end

  describe "認可・異常系" do
    it "他人の単語は削除できない（not found）" do
      other_word = create(:word, wordbook: create(:wordbook, user: create(:user)))

      expect {
        @data = execute_delete(other_word.id)
      }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("id")
    end

    it "公式単語帳の単語は削除できない（not found）" do
      official_word = create(:word, :official)

      expect {
        @data = execute_delete(official_word.id)
      }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("id")
    end

    it "論理削除済み単語帳の単語は削除できない（not found）" do
      wordbook.discard!

      expect { @data = execute_delete(word.id) }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("id")
    end

    it "未認証は削除できない（system エラー）" do
      expect { @data = execute_delete(word.id, context: {}) }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
