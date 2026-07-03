# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL adminLogin", type: :request do
  let(:mutation) do
    <<~GQL
      mutation AdminLogin($email: String!, $password: String!) {
        adminLogin(email: $email, password: $password) {
          success
          errors { field message }
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

      expect(json.dig("data", "adminLogin", "success")).to be(true)
      expect(json.dig("data", "adminLogin", "errors")).to eq([])
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
    # 認証失敗は例外ではなく {success:false, errors} で返す（top-level errors は出さない）。
    # メール存在を秘匿するため、原因に関わらず同一メッセージにする。
    shared_examples "認証失敗を返す" do
      it "success:false と system エラーを返し、ログイン状態にならない" do
        json = post_admin_login(email: email, password: password)

        expect(json["errors"]).to be_nil
        expect(json.dig("data", "adminLogin", "success")).to be(false)
        expect(json.dig("data", "adminLogin", "user")).to be_nil
        expect(json.dig("data", "adminLogin", "errors", 0, "field")).to eq("system")
        expect(json.dig("data", "adminLogin", "errors", 0, "message"))
          .to eq("メールアドレスまたはパスワードが正しくありません")
        expect(current_admin_me_email).to be_nil
      end
    end

    context "パスワード不一致" do
      before { create(:user, :admin, email: "admin@example.com", password: "password123") }
      let(:email) { "admin@example.com" }
      let(:password) { "wrong-password" }
      include_examples "認証失敗を返す"
    end

    context "存在しないメール" do
      let(:email) { "ghost@example.com" }
      let(:password) { "password123" }
      include_examples "認証失敗を返す"
    end

    context "一般ユーザーは管理者ログインから締め出す（スコープ分離）" do
      before { create(:user, email: "taro@example.com", password: "password123") }
      let(:email) { "taro@example.com" }
      let(:password) { "password123" }
      include_examples "認証失敗を返す"
    end
  end
end
