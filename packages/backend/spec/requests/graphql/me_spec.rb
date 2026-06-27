require "rails_helper"

RSpec.describe "GraphQL me", type: :request do
  def post_me
    post "/graphql", params: { query: "{ me { id email name } }" }
    JSON.parse(response.body)
  end

  def login(email)
    post "/graphql", params: {
      query: <<~GQL,
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) { user { id } }
        }
      GQL
      variables: { email: email, password: "password123" }
    }
  end

  describe "正常系" do
    it "ログイン中のユーザーを返す" do
      create(:user, email: "taro@example.com", password: "password123")
      login("taro@example.com")

      json = post_me
      expect(json.dig("data", "me", "email")).to eq("taro@example.com")
    end
  end

  describe "未認証時のハンドリング" do
    it "未ログインは me: null を返す（エラーにしない）" do
      json = post_me

      expect(json.dig("data", "me")).to be_nil
      expect(json["errors"]).to be_nil
    end
  end
end
