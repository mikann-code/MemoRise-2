require "rails_helper"

# GraphQL の疎通を確認する request spec の雛形。
# 機能を実装したら、この形を雛形に Query / Mutation のスペックを足していく。
RSpec.describe "GraphQL foundation", type: :request do
  describe "health クエリ" do
    it "稼働メッセージを返す" do
      post "/graphql", params: { query: "{ health }" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("data", "health")).to eq("MemoRise GraphQL API is running")
    end
  end

  describe "noop ミューテーション" do
    it "true を返す" do
      post "/graphql", params: { query: "mutation { noop }" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("data", "noop")).to be(true)
    end
  end
end
