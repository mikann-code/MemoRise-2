# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::CreateAdminWord do
  let(:mutation) do
    <<~GQL
      mutation CreateAdminWord($wordbookId: ID!, $question: String!, $answer: String!) {
        createAdminWord(wordbookId: $wordbookId, question: $question, answer: $answer) {
          success
          errors { field message }
          word { id question answer }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }
  # 単語を追加できるのは章（子単語帳）のみ。教材（親）は入れ物なので拒否される。
  let(:parent) { create(:wordbook, :official) }
  let(:wordbook) { create(:wordbook, :official, parent: parent) }

  def execute_create(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "createAdminWord")
  end

  describe "正常系" do
    it "章（子の公式単語帳）に単語を追加する（user は付かない）" do
      data = execute_create(
        { wordbookId: wordbook.id.to_s, question: "apple", answer: "りんご" }
      )

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      word = Word.find(data.dig("word", "id"))
      expect(word.wordbook_id).to eq(wordbook.id)
      expect(word.user_id).to be_nil
    end
  end

  describe "異常系" do
    it "question が空ならバリデーションエラー" do
      data = execute_create({ wordbookId: wordbook.id.to_s, question: "", answer: "答え" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("question")
    end

    it "自作単語帳には追加できない（wordbookId エラー）" do
      personal = create(:wordbook)

      data = execute_create({ wordbookId: personal.id.to_s, question: "a", answer: "い" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "教材（親単語帳）には追加できない（wordbookId エラー）" do
      data = execute_create({ wordbookId: parent.id.to_s, question: "a", answer: "い" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
      expect(parent.words.count).to eq(0)
    end
  end

  describe "認可" do
    it "一般ユーザーは追加できない（system エラー・top-level errors 無し）" do
      user = create(:user)

      result = execute_graphql(
        mutation,
        variables: { wordbookId: wordbook.id.to_s, question: "a", answer: "い" },
        context: { current_user: user }
      )
      data = result.dig("data", "createAdminWord")

      expect(result["errors"]).to be_nil
      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.words.count).to eq(0)
    end

    it "未認証は追加できない" do
      data = execute_create(
        { wordbookId: wordbook.id.to_s, question: "a", answer: "い" }, context: {}
      )

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
