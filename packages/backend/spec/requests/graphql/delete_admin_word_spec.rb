# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::DeleteAdminWord do
  let(:mutation) do
    <<~GQL
      mutation DeleteAdminWord($id: ID!) {
        deleteAdminWord(id: $id) {
          success
          errors { field message }
          word { id }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }
  let(:word) { create(:word, :official) }

  def execute_delete(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "deleteAdminWord")
  end

  describe "正常系" do
    it "公式単語帳の単語を物理削除する" do
      target = word

      data = execute_delete({ id: target.id.to_s })

      expect(data["success"]).to be(true)
      expect(Word.exists?(target.id)).to be(false)
    end
  end

  describe "異常系" do
    it "自作単語帳の単語は対象外（not found）" do
      personal_word = create(:word)

      data = execute_delete({ id: personal_word.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(Word.exists?(personal_word.id)).to be(true)
    end
  end

  describe "認可" do
    it "一般ユーザーは削除できない" do
      user = create(:user)
      target = word

      result = execute_graphql(
        mutation, variables: { id: target.id.to_s }, context: { current_user: user }
      )
      data = result.dig("data", "deleteAdminWord")

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(Word.exists?(target.id)).to be(true)
    end
  end
end
