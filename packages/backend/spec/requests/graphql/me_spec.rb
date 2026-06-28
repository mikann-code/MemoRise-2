# frozen_string_literal: true

require "rails_helper"

RSpec.describe Types::QueryType do
  let(:query) do
    <<~GQL
      query {
        me { id email name }
      }
    GQL
  end

  it "ログイン中のユーザーを返す" do
    user = create(:user, email: "taro@example.com")

    result = execute_graphql(query, context: { current_user: user, session: {} })

    expect(result.dig("data", "me", "email")).to eq("taro@example.com")
  end

  it "未ログインは me: null を返す（エラーにしない）" do
    result = execute_graphql(query)

    expect(result.dig("data", "me")).to be_nil
    expect(result["errors"]).to be_nil
  end
end
