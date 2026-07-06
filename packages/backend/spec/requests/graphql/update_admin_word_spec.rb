# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::UpdateAdminWord do
  let(:mutation) do
    <<~GQL
      mutation UpdateAdminWord($id: ID!, $question: String, $answer: String) {
        updateAdminWord(id: $id, question: $question, answer: $answer) {
          success
          errors { field message }
          word { id question answer }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }
  let(:word) { create(:word, :official, question: "apple", answer: "りんご") }

  def execute_update(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "updateAdminWord")
  end

  describe "正常系" do
    it "渡した項目のみ更新する" do
      data = execute_update({ id: word.id.to_s, answer: "リンゴ" })

      expect(data["success"]).to be(true)
      expect(data.dig("word", "question")).to eq("apple")
      expect(word.reload.answer).to eq("リンゴ")
    end
  end

  describe "異常系" do
    it "answer を空にはできない" do
      data = execute_update({ id: word.id.to_s, answer: "" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("answer")
    end

    it "自作単語帳の単語は対象外（not found）" do
      personal_word = create(:word, question: "own", answer: "自分の")

      data = execute_update({ id: personal_word.id.to_s, answer: "x" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end
  end

  describe "認可" do
    it "一般ユーザーは更新できない" do
      user = create(:user)

      result = execute_graphql(
        mutation, variables: { id: word.id.to_s, answer: "x" }, context: { current_user: user }
      )
      data = result.dig("data", "updateAdminWord")

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(word.reload.answer).to eq("りんご")
    end
  end
end
