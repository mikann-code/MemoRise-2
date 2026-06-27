# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL signUp", type: :request do
  let(:mutation) do
    <<~GQL
      mutation SignUp($name: String!, $email: String!, $password: String!) {
        signUp(name: $name, email: $email, password: $password) {
          user { id name email role streak wordsCount }
        }
      }
    GQL
  end

  def post_sign_up(variables)
    post "/graphql", params: { query: mutation, variables: variables }
    JSON.parse(response.body)
  end

  # 同一セッション（Cookie）で me を引き、ログイン状態を確認する。
  def current_me_email
    post "/graphql", params: { query: "{ me { email } }" }
    JSON.parse(response.body).dig("data", "me", "email")
  end

  describe "正常系" do
    it "ユーザーを作成し、作成したユーザーを返す" do
      expect {
        @json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "password123")
      }.to change(User, :count).by(1)

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
  end

  describe "異常系" do
    it "メール重複はエラーを返し、ユーザーを作成しない" do
      create(:user, email: "dup@example.com")

      expect {
        @json = post_sign_up(name: "別人", email: "dup@example.com", password: "password123")
      }.not_to change(User, :count)

      expect(@json["errors"]).to be_present
      expect(@json.dig("data", "signUp")).to be_nil
    end

    it "8 文字未満のパスワードは UNPROCESSABLE_ENTITY" do
      json = post_sign_up(name: "山田太郎", email: "taro@example.com", password: "short")

      expect(json["errors"]).to be_present
      expect(json.dig("errors", 0, "extensions", "code")).to eq("UNPROCESSABLE_ENTITY")
    end
  end
end
