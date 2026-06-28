# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL login", type: :request do
  let(:mutation) do
    <<~GQL
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          user { id email role }
        }
      }
    GQL
  end

  def post_login(variables)
    post "/graphql", params: { query: mutation, variables: variables }
    JSON.parse(response.body)
  end

  def current_me_email
    post "/graphql", params: { query: "{ me { email } }" }
    JSON.parse(response.body).dig("data", "me", "email")
  end

  describe "正常系" do
    let!(:user) { create(:user, email: "taro@example.com", password: "password123") }

    it "正しい認証情報でユーザーを返し、ログイン状態になる" do
      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "user", "email")).to eq("taro@example.com")
      expect(current_me_email).to eq("taro@example.com")
    end

    it "メールは大小・前後空白を無視して照合する" do
      json = post_login(email: "  TARO@Example.com ", password: "password123")
      expect(json.dig("data", "login", "user", "email")).to eq("taro@example.com")
    end
  end

  describe "異常系・認可" do
    it "パスワード不一致は UNAUTHORIZED で、ログイン状態にならない" do
      create(:user, email: "taro@example.com", password: "password123")
      json = post_login(email: "taro@example.com", password: "wrong-password")

      expect(json.dig("data", "login")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
      expect(current_me_email).to be_nil
    end

    it "存在しないメールは UNAUTHORIZED" do
      json = post_login(email: "ghost@example.com", password: "password123")

      expect(json.dig("data", "login")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end

    it "管理者は一般ログインから締め出す（スコープ分離）" do
      create(:user, :admin, email: "admin@example.com", password: "password123")
      json = post_login(email: "admin@example.com", password: "password123")

      expect(json.dig("data", "login")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
