require "rails_helper"

RSpec.describe Resolvers::TaggedWords do
  let(:query) do
    <<~GQL
      query {
        taggedWords { id question answer }
      }
    GQL
  end

  let!(:user) { create(:user) }

  describe "正常系" do
    it "自分の復習タグ付き単語をタグ付けの新しい順で返す" do
      older = create(:word, question: "old")
      newer = create(:word, question: "new")
      create(:user_word_tag, user: user, word: older, created_at: 1.day.ago)
      create(:user_word_tag, user: user, word: newer, created_at: Time.current)

      result = execute_graphql(query, context: { current_user: user })
      questions = result.dig("data", "taggedWords").map { |w| w["question"] }

      expect(questions).to eq([ "new", "old" ])
    end

    it "公式単語帳の単語のタグも返す（単語帳横断）" do
      official_word = create(:word, :official, question: "official")
      create(:user_word_tag, user: user, word: official_word)

      result = execute_graphql(query, context: { current_user: user })
      questions = result.dig("data", "taggedWords").map { |w| w["question"] }

      expect(questions).to eq([ "official" ])
    end

    it "タグが無ければ空配列を返す" do
      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "taggedWords")).to eq([])
    end
  end

  describe "認可・異常系" do
    it "他人のタグは含めない（current_user スコープ）" do
      other = create(:user)
      create(:user_word_tag, user: other)

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "taggedWords")).to eq([])
    end

    it "review 以外のタグは含めない" do
      create(:user_word_tag, user: user, tag: "favorite")

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "taggedWords")).to eq([])
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_graphql(query)

      expect(result.dig("data", "taggedWords")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
