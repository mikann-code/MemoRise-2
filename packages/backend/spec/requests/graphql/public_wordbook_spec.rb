# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::PublicWordbook do
  let(:user) { create(:user) }
  let(:query) do
    <<~GQL
      query($id: ID!) {
        publicWordbook(id: $id) {
          id title label
          children { id title orderIndex wordsCount words { id question answer } }
        }
      }
    GQL
  end

  describe "正常系" do
    it "公式の親と、その子（章）・単語を読み取り専用で返す" do
      parent = create(:wordbook, :official, title: "TOEIC", label: "toeic")
      chapter = create(:wordbook, :official, title: "Day1", parent_id: parent.id, order_index: 1)
      create(:word, wordbook: chapter, question: "apple", answer: "りんご")

      result = execute_graphql(query, variables: { id: parent.id.to_s }, context: { current_user: user })
      data = result.dig("data", "publicWordbook")

      expect(data["title"]).to eq("TOEIC")
      expect(data.dig("children", 0, "orderIndex")).to eq(1)
      expect(data.dig("children", 0, "wordsCount")).to eq(1)
      expect(data.dig("children", 0, "words", 0, "question")).to eq("apple")
      expect(data.dig("children", 0, "words", 0, "answer")).to eq("りんご")
    end

    it "子（章）は論理削除を除外し order_index 昇順で返す" do
      parent = create(:wordbook, :official)
      create(:wordbook, :official, title: "Day2", parent_id: parent.id, order_index: 2)
      create(:wordbook, :official, title: "Day1", parent_id: parent.id, order_index: 1)
      create(:wordbook, :official, :discarded, title: "削除章", parent_id: parent.id, order_index: 3)

      result = execute_graphql(query, variables: { id: parent.id.to_s }, context: { current_user: user })
      titles = result.dig("data", "publicWordbook", "children").map { |c| c["title"] }

      expect(titles).to eq([ "Day1", "Day2" ])
    end
  end

  describe "認可・異常系" do
    it "自作（personal）単語帳は取得できない（null）" do
      personal = create(:wordbook, title: "自作帳") # personal

      result = execute_graphql(query, variables: { id: personal.id.to_s }, context: { current_user: user })

      expect(result.dig("data", "publicWordbook")).to be_nil
      expect(result["errors"]).to be_nil
    end

    it "下書き（draft）の教材は取得できない（null。存在を教えない）" do
      draft = create(:wordbook, :official, :draft, title: "準備中")

      result = execute_graphql(query, variables: { id: draft.id.to_s }, context: { current_user: user })

      expect(result.dig("data", "publicWordbook")).to be_nil
      expect(result["errors"]).to be_nil
    end

    it "存在しない id は null" do
      result = execute_graphql(query, variables: { id: "0" }, context: { current_user: user })

      expect(result.dig("data", "publicWordbook")).to be_nil
    end

    it "未認証は UNAUTHORIZED" do
      parent = create(:wordbook, :official)

      result = execute_graphql(query, variables: { id: parent.id.to_s })

      expect(result.dig("data", "publicWordbook")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
