# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL adminLogin", type: :request do
  let(:mutation) do
    <<~GQL
      mutation AdminLogin($email: String!, $password: String!) {
        adminLogin(email: $email, password: $password) {
          user { id email role }
        }
      }
    GQL
  end

  def post_admin_login(variables)
    post "/graphql", params: { query: mutation, variables: variables }
    JSON.parse(response.body)
  end

  def current_admin_me_email
    post "/graphql", params: { query: "{ adminMe { email } }" }
    JSON.parse(response.body).dig("data", "adminMe", "email")
  end

  describe "正常系" do
    let!(:admin) { create(:user, :admin, email: "admin@example.com", password: "password123") }

    it "正しい認証情報で管理者を返し、ログイン状態になる" do
      json = post_admin_login(email: "admin@example.com", password: "password123")

      expect(json.dig("data", "adminLogin", "user", "email")).to eq("admin@example.com")
      expect(json.dig("data", "adminLogin", "user", "role")).to eq("admin")
      expect(current_admin_me_email).to eq("admin@example.com")
    end

    it "メールは大小・前後空白を無視して照合する" do
      json = post_admin_login(email: "  ADMIN@Example.com ", password: "password123")
      expect(json.dig("data", "adminLogin", "user", "email")).to eq("admin@example.com")
    end
  end

  describe "異常系・認可" do
    it "パスワード不一致は UNAUTHORIZED で、ログイン状態にならない" do
      create(:user, :admin, email: "admin@example.com", password: "password123")
      json = post_admin_login(email: "admin@example.com", password: "wrong-password")

      expect(json.dig("data", "adminLogin")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
      expect(current_admin_me_email).to be_nil
    end

    it "存在しないメールは UNAUTHORIZED" do
      json = post_admin_login(email: "ghost@example.com", password: "password123")

      expect(json.dig("data", "adminLogin")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end

    it "一般ユーザーは管理者ログインから締め出す（スコープ分離）" do
      create(:user, email: "taro@example.com", password: "password123")
      json = post_admin_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "adminLogin")).to be_nil
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
      expect(current_admin_me_email).to be_nil
    end
  end
end
