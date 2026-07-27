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

  describe "streak" do
    let(:streak_query) do
      <<~GQL
        query {
          me { streak }
        }
      GQL
    end

    def fetch_streak(user)
      execute_graphql(streak_query, context: { current_user: user })
        .dig("data", "me", "streak")
    end

    it "最終学習が昨日までなら継続中としてそのまま返す" do
      user = create(:user)
      user.update_columns(streak: 3, last_study_date: Time.zone.today - 1)

      expect(fetch_streak(user)).to eq(3)
    end

    it "最終学習が一昨日以前なら 0 を返す（途切れた分は繰り越さない）" do
      user = create(:user)
      user.update_columns(streak: 3, last_study_date: Time.zone.today - 2)

      expect(fetch_streak(user)).to eq(0)
    end
  end
end
