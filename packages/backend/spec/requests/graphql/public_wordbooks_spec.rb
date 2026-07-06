# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::PublicWordbooks do
  let(:query) do
    <<~GQL
      query {
        publicWordbooks { id title label level kind }
      }
    GQL
  end

  let(:user) { create(:user) }

  describe "正常系" do
    it "公式の親単語帳のみを order_index 昇順で返す" do
      official_b = create(:wordbook, :official, title: "TOEIC", order_index: 2)
      official_a = create(:wordbook, :official, title: "英検", order_index: 1)
      # 子（章）は親一覧に出ない
      create(:wordbook, :official, title: "Day1", parent_id: official_a.id, order_index: 1)

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "publicWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "英検", "TOEIC" ])
    end

    it "ラベル / レベル / kind を返す" do
      create(:wordbook, :official, title: "TOEIC", label: "toeic", level: "standard")

      result = execute_graphql(query, context: { current_user: user })
      wb = result.dig("data", "publicWordbooks").first

      expect(wb["label"]).to eq("toeic")
      expect(wb["level"]).to eq("standard")
      expect(wb["kind"]).to eq("official")
    end
  end

  describe "認可・異常系" do
    it "自作（personal）単語帳は公式一覧に含めない（スコープ分離）" do
      create(:wordbook, title: "自作帳") # personal（user あり）
      create(:wordbook, :official, title: "公式帳")

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "publicWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "公式帳" ])
    end

    it "論理削除された公式単語帳は除外する" do
      create(:wordbook, :official, :discarded, title: "削除済")
      create(:wordbook, :official, title: "公開中")

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "publicWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "公開中" ])
    end

    it "未認証は UNAUTHORIZED" do
      create(:wordbook, :official, title: "公式帳")

      result = execute_graphql(query)

      expect(result.dig("data", "publicWordbooks")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
