require "rails_helper"

RSpec.describe Resolvers::TodayWord do
  let(:query) do
    <<~GQL
      query {
        todayWord { id question answer }
      }
    GQL
  end

  let(:user) { create(:user) }

  describe "正常系" do
    it "公式単語帳の単語を 1 件返す" do
      official = create(:word, :official, question: "official", answer: "公式の答え")

      result = execute_graphql(query, context: { current_user: user })
      word = result.dig("data", "todayWord")

      expect(word["id"]).to eq(official.id.to_s)
      expect(word["question"]).to eq("official")
      expect(word["answer"]).to eq("公式の答え")
    end

    it "公式単語が複数あってもそのいずれか 1 件を返す" do
      questions = create_list(:word, 3, :official).map(&:question)

      result = execute_graphql(query, context: { current_user: user })

      expect(questions).to include(result.dig("data", "todayWord", "question"))
    end

    it "自作単語は出題対象にしない（公式のみ）" do
      create(:word, question: "personal") # personal（user あり）

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "todayWord")).to be_nil
    end

    it "論理削除された公式単語帳の単語は出題しない" do
      discarded = create(:wordbook, :official, :discarded)
      create(:word, :official, wordbook: discarded, user: nil, question: "deleted")

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "todayWord")).to be_nil
    end
  end

  describe "公式単語 0 件時" do
    it "null を返す（フロントは fallbackWords に切り替える）" do
      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "todayWord")).to be_nil
      expect(result["errors"]).to be_nil
    end
  end

  describe "認可・異常系" do
    it "未認証は UNAUTHORIZED" do
      create(:word, :official)

      result = execute_graphql(query)

      expect(result.dig("data", "todayWord")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
