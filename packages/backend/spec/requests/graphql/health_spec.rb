require "rails_helper"

# GraphQL の疎通を確認するサンプル request spec。
# 機能を実装したら、この形を雛形に Query/Mutation のスペックを足していく。
RSpec.describe "GraphQL health", type: :request do
  it "health クエリで稼働メッセージを返す" do
    post "/graphql", params: { query: "{ health }" }

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.dig("data", "health")).to eq("MemoRise GraphQL API is running")
  end
end
