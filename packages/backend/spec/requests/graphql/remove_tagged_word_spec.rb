require "rails_helper"

RSpec.describe Mutations::RemoveTaggedWord do
  let(:mutation) do
    <<~GQL
      mutation RemoveTaggedWord($wordId: ID!) {
        removeTaggedWord(wordId: $wordId) {
          success
          errors { field message }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:word) { create(:word, wordbook: create(:wordbook, user: user)) }

  def execute_remove(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "removeTaggedWord")
  end

  describe "正常系" do
    it "自分の復習タグを外す" do
      create(:user_word_tag, user: user, word: word)

      expect {
        @data = execute_remove({ wordId: word.id.to_s })
      }.to change(user.user_word_tags, :count).by(-1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
    end

    it "タグが無い単語でも成功を返す（冪等）" do
      expect {
        @data = execute_remove({ wordId: word.id.to_s })
      }.not_to change(UserWordTag, :count)

      expect(@data["success"]).to be(true)
    end
  end

  describe "認可・異常系" do
    it "他人のタグは外せない（current_user スコープで対象外）" do
      other = create(:user)
      create(:user_word_tag, user: other, word: word)

      expect {
        @data = execute_remove({ wordId: word.id.to_s })
      }.not_to change(UserWordTag, :count)

      # 自分のタグが無いだけなので冪等に成功を返し、他人のタグは残る。
      expect(@data["success"]).to be(true)
    end

    it "review 以外のタグは外さない" do
      create(:user_word_tag, user: user, word: word, tag: "favorite")

      expect {
        execute_remove({ wordId: word.id.to_s })
      }.not_to change(UserWordTag, :count)
    end

    it "未認証は外せない（system エラー）" do
      create(:user_word_tag, user: user, word: word)

      data = execute_remove({ wordId: word.id.to_s }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(user.user_word_tags.count).to eq(1)
    end
  end
end
