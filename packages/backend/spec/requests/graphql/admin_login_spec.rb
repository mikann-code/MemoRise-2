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
    post "/graphql", params: { query: mutation, variables: variables }, as: :json
    JSON.parse(response.body)
  end

  def current_admin_me_email
    post "/graphql", params: { query: "{ adminMe { email } }" }, as: :json
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

    # セッション固定攻撃への備え。ログイン前から持っていたセッション ID はログイン後に使えない。
    it "ログイン時にセッション ID を作り直し、ログイン前の ID ではログイン状態にならない" do
      # ログアウト（reset_session）で未ログインのセッションを発行させ、その ID を控える。
      post "/graphql", params: { query: "mutation { logout { success } }" }, as: :json
      before_login = cookies["_memorise_session"]
      expect(before_login).to be_present

      post_admin_login(email: "admin@example.com", password: "password123")
      expect(cookies["_memorise_session"]).not_to eq(before_login)
      expect(current_admin_me_email).to eq("admin@example.com")

      cookies["_memorise_session"] = before_login
      expect(current_admin_me_email).to be_nil
    end
  end

  # 失敗回数の数え方は login と共通（BaseMutation）。管理者ログインでも効くことを確認する。
  describe "試行回数の制限" do
    let!(:admin) { create(:user, :admin, email: "admin@example.com", password: "password123") }

    it "10 回失敗すると、正しいパスワードでもログインできない" do
      10.times { post_admin_login(email: "admin@example.com", password: "wrong-password") }

      json = post_admin_login(email: "admin@example.com", password: "password123")

      expect(json.dig("data", "adminLogin", "success")).to be(false)
      expect(json.dig("data", "adminLogin", "errors", 0, "message"))
        .to eq("試行回数が多すぎます。しばらく時間をおいてから再度お試しください")
      expect(current_admin_me_email).to be_nil
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
