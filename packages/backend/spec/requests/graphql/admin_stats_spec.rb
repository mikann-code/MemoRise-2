# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::AdminStats do
  let(:query) do
    <<~GQL
      query {
        adminStats {
          usersCount
          wordsCount
          officialWordbooksCount
          personalWordbooksCount
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  describe "正常系" do
    it "ユーザー数・単語数・公式/自作単語帳数を集計して返す" do
      admin
      # 一般ユーザー 2 名（after_create で自作単語帳が 1 冊ずつ作られる）
      create(:user)
      create(:user)

      official = create(:wordbook, :official, title: "公式")
      create(:wordbook, :official, :discarded) # 論理削除は数えない
      create(:word, wordbook: official, user: nil, question: "a", answer: "い")

      data = execute_graphql(query, context: { current_admin: admin }).dig("data", "adminStats")

      expect(data["usersCount"]).to eq(2) # 管理者は含めない
      expect(data["wordsCount"]).to eq(1)
      expect(data["officialWordbooksCount"]).to eq(1)
      expect(data["personalWordbooksCount"]).to eq(2) # 一般ユーザーの既定単語帳 2 冊
    end
  end

  describe "認可" do
    it "一般ユーザーは FORBIDDEN" do
      user = create(:user)
      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "adminStats")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end
  end
end
