require "rails_helper"

RSpec.describe Mutations::AddTaggedWord do
  let(:mutation) do
    <<~GQL
      mutation AddTaggedWord($wordId: ID!) {
        addTaggedWord(wordId: $wordId) {
          success
          errors { field message }
          word { id question answer }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user) }
  let!(:word) { create(:word, wordbook: wordbook) }

  def execute_add(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "addTaggedWord")
  end

  describe "正常系" do
    it "自分の単語に復習タグ（review）を付ける" do
      expect {
        @data = execute_add({ wordId: word.id.to_s })
      }.to change(user.user_word_tags, :count).by(1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(@data.dig("word", "id")).to eq(word.id.to_s)
      expect(user.user_word_tags.last.tag).to eq(UserWordTag::REVIEW)
    end

    it "公式単語帳の単語にもタグを付けられる（単語帳横断）" do
      official_word = create(:word, :official)

      expect {
        @data = execute_add({ wordId: official_word.id.to_s })
      }.to change(user.user_word_tags, :count).by(1)

      expect(@data["success"]).to be(true)
    end

    it "タグ済みの単語は二重登録せず成功を返す（冪等）" do
      execute_add({ wordId: word.id.to_s })

      expect {
        @data = execute_add({ wordId: word.id.to_s })
      }.not_to change(UserWordTag, :count)

      expect(@data["success"]).to be(true)
    end
  end

  describe "認可・異常系" do
    it "他人の単語にはタグを付けられない（wordId エラー）" do
      other_word = create(:word, wordbook: create(:wordbook, user: create(:user)))

      expect {
        @data = execute_add({ wordId: other_word.id.to_s })
      }.not_to change(UserWordTag, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordId")
    end

    it "所属単語帳が論理削除済みの単語にはタグを付けられない（wordId エラー）" do
      wordbook.discard!

      data = execute_add({ wordId: word.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordId")
    end

    it "存在しない単語はエラー（wordId エラー）" do
      data = execute_add({ wordId: "0" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordId")
    end

    it "未認証はタグを付けられない（system エラー）" do
      data = execute_add({ wordId: word.id.to_s }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
