require "rails_helper"

RSpec.describe "GraphQL logout", type: :request do
  def login(user)
    post "/graphql", params: {
      query: <<~GQL,
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) { user { id } }
        }
      GQL
      variables: { email: user.email, password: "password123" }
    }
  end

  def post_logout
    post "/graphql", params: { query: "mutation { logout { success } }" }
    JSON.parse(response.body)
  end

  def logged_in?
    post "/graphql", params: { query: "{ me { id } }" }
    !JSON.parse(response.body).dig("data", "me").nil?
  end

  it "ログイン中にログアウトするとセッションが破棄される" do
    user = create(:user, email: "taro@example.com", password: "password123")
    login(user)
    expect(logged_in?).to be(true)

    json = post_logout
    expect(json.dig("data", "logout", "success")).to be(true)
    expect(logged_in?).to be(false)
  end

  it "未ログインでも成功を返す（冪等）" do
    json = post_logout
    expect(json.dig("data", "logout", "success")).to be(true)
  end
end
