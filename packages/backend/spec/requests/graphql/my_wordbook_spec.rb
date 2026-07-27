require "rails_helper"

RSpec.describe Resolvers::MyWordbook do
  let(:query) do
    <<~GQL
      query MyWordbook($id: ID!) {
        myWordbook(id: $id) {
          id title description label wordsCount
          words { id question answer }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }

  def execute_my_wordbook(id, context: { current_user: user })
    execute_graphql(query, variables: { id: id.to_s }, context: context)
  end

  describe "正常系" do
    it "自分の自作単語帳を単語（新しい順）付きで返す" do
      wordbook = create(:wordbook, user: user, title: "英単語")
      create(:word, wordbook: wordbook, question: "apple", answer: "りんご")
      create(:word, wordbook: wordbook, question: "book", answer: "本")

      data = execute_my_wordbook(wordbook.id).dig("data", "myWordbook")

      expect(data["title"]).to eq("英単語")
      expect(data["wordsCount"]).to eq(2)
      # 後から追加した単語が先頭に来る（追加直後にスクロールせず確認できる）
      expect(data["words"].map { |w| w["question"] }).to eq([ "book", "apple" ])
    end
  end

  describe "認可・異常系" do
    it "他人の自作単語帳は null（ID 総当たりで覗けない）" do
      other_wordbook = create(:wordbook, user: create(:user))

      result = execute_my_wordbook(other_wordbook.id)

      expect(result.dig("data", "myWordbook")).to be_nil
    end

    it "公式（official）単語帳は null" do
      official = create(:wordbook, :official)

      expect(execute_my_wordbook(official.id).dig("data", "myWordbook")).to be_nil
    end

    it "論理削除済みは null" do
      wordbook = create(:wordbook, user: user)
      wordbook.discard!

      expect(execute_my_wordbook(wordbook.id).dig("data", "myWordbook")).to be_nil
    end

    it "未認証は UNAUTHORIZED" do
      wordbook = create(:wordbook, user: user)

      result = execute_my_wordbook(wordbook.id, context: {})

      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
