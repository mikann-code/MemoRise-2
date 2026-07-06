# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::AdminWordbooks do
  let(:query) do
    <<~GQL
      query {
        adminWordbooks { id title label level kind parentId }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  describe "正常系" do
    it "公式の教材（トップレベル）のみを order_index 昇順で返す" do
      create(:wordbook, :official, title: "TOEIC", order_index: 2)
      parent_a = create(:wordbook, :official, title: "英検", order_index: 1)
      # 章（子）は教材一覧に出ない
      create(:wordbook, :official, title: "Day1", parent_id: parent_a.id, order_index: 1)

      result = execute_graphql(query, context: { current_admin: admin })
      titles = result.dig("data", "adminWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "英検", "TOEIC" ])
    end

    it "自作単語帳・論理削除済みは含めない" do
      create(:wordbook, title: "自作帳") # personal
      create(:wordbook, :official, :discarded, title: "削除済")
      create(:wordbook, :official, title: "公開中")

      result = execute_graphql(query, context: { current_admin: admin })
      titles = result.dig("data", "adminWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "公開中" ])
    end
  end

  describe "認可" do
    it "一般ユーザーは FORBIDDEN" do
      user = create(:user)
      create(:wordbook, :official, title: "公式帳")

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "adminWordbooks")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end

    it "未認証は FORBIDDEN" do
      result = execute_graphql(query)

      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end
  end
end
