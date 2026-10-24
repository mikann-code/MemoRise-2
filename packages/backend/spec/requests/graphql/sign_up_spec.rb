# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL signUp", type: :request do
  let(:mutation) do
    <<~GQL
      mutation SignUp($name: String!, $email: String!, $password: String!) {
        signUp(name: $name, email: $email, password: $password) {
          success
          errors { field message }
          user { id name email role streak wordsCount }
        }
      }
    GQL
  end

  def post_sign_up(variables)
    post "/graphql", params: { query: mutation, variables: variables }, as: :json
    JSON.parse(response.body)
  end

  # 同一セッション（Cookie）で me を引き、ログイン状態を確認する。
  def current_me_email
    post "/graphql", params: { query: "{ me { email } }" }, as: :json
    JSON.parse(response.body).dig("data", "me", "email")
  end

  describe "正常系" do
    it "ユーザーを作成し、作成したユーザーを返す" do
      expect {
        @json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
      }.to change(User, :count).by(1)

      expect(@json.dig("data", "signUp", "success")).to be(true)
      expect(@json.dig("data", "signUp", "errors")).to eq([])
      user = @json.dig("data", "signUp", "user")
      expect(user["email"]).to eq("taro@example.com")
      expect(user["role"]).to eq("user")
    end

    it "作成後はそのままログイン状態になる（自動ログイン）" do
      post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")

      expect(current_me_email).to eq("taro@example.com")
    end

    it "「はじめての単語帳」が自動生成される" do
      post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
      user = User.find_by(email: "taro@example.com")

      expect(user.wordbooks.pluck(:title)).to eq([ "はじめての単語帳" ])
    end

    # セッション固定攻撃への備え。登録前から持っていたセッション ID は登録後に使えない。
    it "登録時にセッション ID を作り直し、登録前の ID ではログイン状態にならない" do
      # ログアウト（reset_session）で未ログインのセッションを発行させ、その ID を控える。
      post "/graphql", params: { query: "mutation { logout { success } }" }, as: :json
      before_sign_up = cookies["_memorise_session"]
      expect(before_sign_up).to be_present

      post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
      expect(cookies["_memorise_session"]).not_to eq(before_sign_up)
      expect(current_me_email).to eq("taro@example.com")

      cookies["_memorise_session"] = before_sign_up
      expect(current_me_email).to be_nil
    end
  end

  # 同じ IP から 1 時間に 10 件まで登録できる（数えるのは登録に成功した件数）。
  describe "登録件数の制限" do
    def sign_up_many(times)
      times.times { |i| post_sign_up(name: "利用者#{i}", email: "user#{i}@example.com", password: "password123") }
    end

    it "同じ IP から 10 件登録すると、11 件目は errors を返し、ユーザーを作成しない" do
      sign_up_many(10)

      expect {
        @json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
      }.not_to change(User, :count)

      expect(@json.dig("data", "signUp", "success")).to be(false)
      expect(@json.dig("data", "signUp", "errors", 0, "field")).to eq("system")
      expect(@json.dig("data", "signUp", "errors", 0, "message"))
        .to eq("試行回数が多すぎます。しばらく時間をおいてから再度お試しください")
    end

    it "入力エラーで登録できなかった分は数えない" do
      sign_up_many(9)
      3.times { post_sign_up(name: "山田太郎", email: "not-an-email", password: "password123") }

      json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")

      expect(json.dig("data", "signUp", "success")).to be(true)
    end

    it "1 時間経つと、再び登録できる" do
      sign_up_many(10)

      travel 1.hour + 1.second do
        json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
        expect(json.dig("data", "signUp", "success")).to be(true)
      end
    end
  end

  describe "異常系" do
    # 入力エラーは例外ではなく {success:false, errors} で返す（top-level errors は出さない）。
    it "メール重複は success:false と email エラーを返し、ユーザーを作成しない" do
      create(:user, email: "dup@example.com")

      expect {
        @json = post_sign_up(name: "別人", email: "dup@example.com", password: "password123")
      }.not_to change(User, :count)

      expect(@json["errors"]).to be_nil
      expect(@json.dig("data", "signUp", "success")).to be(false)
      expect(@json.dig("data", "signUp", "user")).to be_nil
      expect(@json.dig("data", "signUp", "errors").map { |e| e["field"] }).to include("email")
    end

    it "不正な形式のメールは success:false と email エラーを返し、ユーザーを作成しない" do
      expect {
        @json = post_sign_up(name: "山田太郎", email: "not-an-email", password: "password123")
      }.not_to change(User, :count)

      expect(@json["errors"]).to be_nil
      expect(@json.dig("data", "signUp", "success")).to be(false)
      expect(@json.dig("data", "signUp", "user")).to be_nil
      expect(@json.dig("data", "signUp", "errors").map { |e| e["field"] }).to include("email")
    end

    it "8 文字未満のパスワードは success:false と password エラーを返す" do
      expect {
        @json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "short")
      }.not_to change(User, :count)

      expect(@json["errors"]).to be_nil
      expect(@json.dig("data", "signUp", "success")).to be(false)
      expect(@json.dig("data", "signUp", "user")).to be_nil
      expect(@json.dig("data", "signUp", "errors").map { |e| e["field"] }).to include("password")
    end
  end
end
