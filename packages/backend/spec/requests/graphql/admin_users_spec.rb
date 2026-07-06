# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::AdminUsers do
  def query(args = "")
    <<~GQL
      query {
        adminUsers#{args} {
          totalCount
          nodes { id name email role wordsCount }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  describe "正常系" do
    it "既定は登録日の新しい順（降順）で全件を返す" do
      admin
      older = create(:user, name: "太郎", created_at: 3.days.ago)
      newer = create(:user, name: "花子", created_at: 1.day.ago)

      result = execute_graphql(query, context: { current_admin: admin }).dig("data", "adminUsers")

      expect(result["totalCount"]).to eq(3)
      # admin は最後に作られている（let の評価順）ため created_at が最も新しい
      expect(result["nodes"].map { |u| u["id"] }).to eq([ admin.id.to_s, newer.id.to_s, older.id.to_s ])
      expect(result["nodes"].map { |u| u["role"] }).to include("admin", "user")
    end

    it "keyword で名前・メールを大小無視の部分一致で絞り込む" do
      admin
      hit = create(:user, name: "Alice", email: "alice@example.com")
      create(:user, name: "Bob", email: "bob@example.com")

      result = execute_graphql(query(%q{(keyword: "ALI")}), context: { current_admin: admin })
                 .dig("data", "adminUsers")

      expect(result["totalCount"]).to eq(1)
      expect(result["nodes"].map { |u| u["id"] }).to eq([ hit.id.to_s ])
    end

    it "keyword の LIKE ワイルドカードはエスケープしてリテラル扱いする" do
      admin
      create(:user, name: "100%", email: "a@example.com")
      create(:user, name: "abc", email: "b@example.com")

      result = execute_graphql(query(%q{(keyword: "100%")}), context: { current_admin: admin })
                 .dig("data", "adminUsers")

      expect(result["totalCount"]).to eq(1)
      expect(result["nodes"].map { |u| u["name"] }).to eq([ "100%" ])
    end

    it "sortBy: WORDS_COUNT, sortOrder: DESC で単語数の多い順に並べる" do
      admin
      create(:user, name: "少", words_count: 1)
      create(:user, name: "多", words_count: 10)

      result = execute_graphql(
        query(%q{(sortBy: WORDS_COUNT, sortOrder: DESC)}),
        context: { current_admin: admin }
      ).dig("data", "adminUsers")

      names = result["nodes"].map { |u| u["name"] }
      expect(names.index("多")).to be < names.index("少")
    end

    it "page / perPage でページングする（totalCount は絞り込み後の総数）" do
      admin
      create_list(:user, 5)

      result = execute_graphql(
        query(%q{(page: 2, perPage: 2)}),
        context: { current_admin: admin }
      ).dig("data", "adminUsers")

      expect(result["totalCount"]).to eq(6) # admin + 5
      expect(result["nodes"].size).to eq(2)
    end

    it "perPage は上限（100）にクランプされる" do
      admin
      result = execute_graphql(query(%q{(perPage: 9999)}), context: { current_admin: admin })
      expect(result.dig("errors")).to be_nil
      expect(result.dig("data", "adminUsers", "totalCount")).to eq(1)
    end
  end

  describe "認可" do
    it "一般ユーザーは FORBIDDEN" do
      user = create(:user)

      result = execute_graphql(query, context: { current_user: user })

      expect(result.dig("data", "adminUsers")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end

    it "未認証は FORBIDDEN" do
      result = execute_graphql(query)
      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end
  end
end
