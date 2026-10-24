# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL login", type: :request do
  let(:mutation) do
    <<~GQL
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          success
          errors { field message }
          user { id email role }
        }
      }
    GQL
  end

  def post_login(variables)
    post "/graphql", params: { query: mutation, variables: variables }, as: :json
    JSON.parse(response.body)
  end

  def current_me_email
    post "/graphql", params: { query: "{ me { email } }" }, as: :json
    JSON.parse(response.body).dig("data", "me", "email")
  end

  describe "正常系" do
    let!(:user) { create(:user, email: "taro@example.com", password: "password123") }

    it "正しい認証情報でユーザーを返し、ログイン状態になる" do
      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "success")).to be(true)
      expect(json.dig("data", "login", "errors")).to eq([])
      expect(json.dig("data", "login", "user", "email")).to eq("taro@example.com")
      expect(current_me_email).to eq("taro@example.com")
    end

    it "メールは大小・前後空白を無視して照合する" do
      json = post_login(email: "  TARO@Example.com ", password: "password123")
      expect(json.dig("data", "login", "user", "email")).to eq("taro@example.com")
    end

    # セッション固定攻撃への備え。ログイン前から持っていたセッション ID はログイン後に使えない。
    it "ログイン時にセッション ID を作り直し、ログイン前の ID ではログイン状態にならない" do
      # ログアウト（reset_session）で未ログインのセッションを発行させ、その ID を控える。
      post "/graphql", params: { query: "mutation { logout { success } }" }, as: :json
      before_login = cookies["_memorise_session"]
      expect(before_login).to be_present

      post_login(email: "taro@example.com", password: "password123")
      expect(cookies["_memorise_session"]).not_to eq(before_login)
      expect(current_me_email).to eq("taro@example.com")

      cookies["_memorise_session"] = before_login
      expect(current_me_email).to be_nil
    end
  end

  # 同じメールアドレスで 15 分に 10 回失敗すると、一定時間ログインを受け付けない。
  describe "試行回数の制限" do
    let!(:user) { create(:user, email: "taro@example.com", password: "password123") }

    def fail_login(times, email: "taro@example.com")
      times.times { post_login(email: email, password: "wrong-password") }
    end

    it "10 回失敗すると、正しいパスワードでもログインできない" do
      fail_login(10)

      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "success")).to be(false)
      expect(json.dig("data", "login", "errors", 0, "field")).to eq("system")
      expect(json.dig("data", "login", "errors", 0, "message"))
        .to eq("試行回数が多すぎます。しばらく時間をおいてから再度お試しください")
      expect(current_me_email).to be_nil
    end

    it "9 回の失敗までは、正しいパスワードでログインできる" do
      fail_login(9)

      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "success")).to be(true)
    end

    it "15 分経つと、再びログインできる" do
      fail_login(10)

      travel 15.minutes + 1.second do
        json = post_login(email: "taro@example.com", password: "password123")
        expect(json.dig("data", "login", "success")).to be(true)
      end
    end

    it "ログインに成功すると失敗回数がリセットされる" do
      fail_login(9)
      post_login(email: "taro@example.com", password: "password123")
      fail_login(9)

      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "success")).to be(true)
    end

    it "失敗回数はメールアドレスごとに数える" do
      create(:user, email: "hanako@example.com", password: "password123")
      fail_login(10, email: "hanako@example.com")

      json = post_login(email: "taro@example.com", password: "password123")

      expect(json.dig("data", "login", "success")).to be(true)
    end
  end

  describe "異常系・認可" do
    # 認証失敗は例外ではなく {success:false, errors} で返す（top-level errors は出さない）。
    # メール存在を秘匿するため、原因に関わらず同一メッセージにする。
    shared_examples "認証失敗を返す" do
      it "success:false と system エラーを返し、ログイン状態にならない" do
        json = post_login(email: email, password: password)

        expect(json["errors"]).to be_nil
        expect(json.dig("data", "login", "success")).to be(false)
        expect(json.dig("data", "login", "user")).to be_nil
        expect(json.dig("data", "login", "errors", 0, "field")).to eq("system")
        expect(json.dig("data", "login", "errors", 0, "message"))
          .to eq("メールアドレスまたはパスワードが正しくありません")
        expect(current_me_email).to be_nil
      end
    end

    context "パスワード不一致" do
      before { create(:user, email: "taro@example.com", password: "password123") }
      let(:email) { "taro@example.com" }
      let(:password) { "wrong-password" }
      include_examples "認証失敗を返す"
    end

    context "存在しないメール" do
      let(:email) { "ghost@example.com" }
      let(:password) { "password123" }
      include_examples "認証失敗を返す"
    end

    context "管理者は一般ログインから締め出す（スコープ分離）" do
      before { create(:user, :admin, email: "admin@example.com", password: "password123") }
      let(:email) { "admin@example.com" }
      let(:password) { "password123" }
      include_examples "認証失敗を返す"
    end
  end
end
