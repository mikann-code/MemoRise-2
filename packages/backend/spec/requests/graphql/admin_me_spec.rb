# frozen_string_literal: true

require "rails_helper"

RSpec.describe Types::QueryType do
  let(:query) do
    <<~GQL
      query {
        adminMe { id email role }
      }
    GQL
  end

  it "ログイン中の管理者を返す" do
    admin = create(:user, :admin, email: "admin@example.com")

    result = execute_graphql(query, context: { current_admin: admin, session: {} })

    expect(result.dig("data", "adminMe", "email")).to eq("admin@example.com")
    expect(result.dig("data", "adminMe", "role")).to eq("admin")
  end

  it "一般ユーザーのコンテキストでは adminMe: null を返す（スコープ分離）" do
    user = create(:user)

    result = execute_graphql(query, context: { current_user: user, session: {} })

    expect(result.dig("data", "adminMe")).to be_nil
    expect(result["errors"]).to be_nil
  end

  it "未ログインは adminMe: null を返す（エラーにしない）" do
    result = execute_graphql(query)

    expect(result.dig("data", "adminMe")).to be_nil
    expect(result["errors"]).to be_nil
  end
end
