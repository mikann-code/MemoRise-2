require "rails_helper"

# GraphQL の疎通を確認する request spec の雛形。
# 機能を実装したら、この形を雛形に Query / Mutation のスペックを足していく。
RSpec.describe "GraphQL foundation", type: :request do
  describe "health クエリ" do
    it "稼働メッセージを返す" do
      post "/graphql", params: { query: "{ health }" }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("data", "health")).to eq("MemoRise GraphQL API is running")
    end
  end

  describe "noop ミューテーション" do
    it "true を返す" do
      post "/graphql", params: { query: "mutation { noop }" }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig("data", "noop")).to be(true)
    end
  end

  # JSON 以外の POST は GraphQL を実行せず 415 を返す（GraphqlController#require_json_request）。
  describe "受け付ける形式" do
    let(:sign_up) do
      'mutation { signUp(name: "山田太郎", email: "taro@example.com", password: "password123") { success } }'
    end

    it "フォーム形式の POST は 415 を返し、Mutation を実行しない" do
      expect {
        post "/graphql", params: { query: sign_up }
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unsupported_media_type)
    end

    it "text/plain の POST は 415 を返し、Mutation を実行しない" do
      expect {
        post "/graphql", params: { query: sign_up }.to_json, headers: { "CONTENT_TYPE" => "text/plain" }
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unsupported_media_type)
    end

    it "JSON の POST は Mutation を実行する" do
      expect {
        post "/graphql", params: { query: sign_up }, as: :json
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:ok)
    end
  end

  # クエリの深さ・複雑度の上限（MemoRiseSchema の max_depth 10 / max_complexity 200）。
  describe "クエリの上限" do
    let(:user) { create(:user) }

    # publicWordbook { children { children { ... { id } } } } を指定の深さで組み立てる。
    def nested_children_query(depth)
      inner = "id"
      (depth - 2).times { inner = "children { #{inner} }" }
      "{ publicWordbook(id: \"0\") { #{inner} } }"
    end

    it "深さ 10 までのクエリは実行できる" do
      result = execute_graphql(nested_children_query(10), context: { current_user: user })

      expect(result["errors"]).to be_nil
    end

    it "深さ 11 のクエリはエラーになる" do
      result = execute_graphql(nested_children_query(11), context: { current_user: user })

      expect(result.dig("errors", 0, "message")).to include("exceeds max depth of 10")
    end

    it "複雑度 200 までのクエリは実行できる" do
      query = "{ #{(1..200).map { |i| "h#{i}: health" }.join(' ')} }"
      result = execute_graphql(query)

      expect(result["errors"]).to be_nil
    end

    it "複雑度 201 のクエリはエラーになる" do
      query = "{ #{(1..201).map { |i| "h#{i}: health" }.join(' ')} }"
      result = execute_graphql(query)

      expect(result.dig("errors", 0, "message")).to include("exceeds max complexity of 200")
    end
  end
end
