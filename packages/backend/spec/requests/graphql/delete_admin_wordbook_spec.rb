# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::DeleteAdminWordbook do
  let(:mutation) do
    <<~GQL
      mutation DeleteAdminWordbook($id: ID!) {
        deleteAdminWordbook(id: $id) {
          success
          errors { field message }
          wordbook { id title }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  def execute_delete(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "deleteAdminWordbook")
  end

  describe "正常系" do
    it "論理削除する（words は残り、復元可能な状態）" do
      wordbook = create(:wordbook, :official)
      word = create(:word, wordbook: wordbook, user: nil)

      data = execute_delete({ id: wordbook.id.to_s })

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      expect(data.dig("wordbook", "id")).to eq(wordbook.id.to_s)

      wordbook.reload
      expect(wordbook.discarded?).to be(true)
      expect(word.reload).to be_persisted
      expect(Wordbook.kept).not_to include(wordbook)
    end

    it "章（子）も単体で論理削除できる" do
      parent = create(:wordbook, :official)
      chapter = create(:wordbook, :official, parent_id: parent.id, part: "1")

      data = execute_delete({ id: chapter.id.to_s })

      expect(data["success"]).to be(true)
      expect(chapter.reload.discarded?).to be(true)
      expect(parent.reload.discarded?).to be(false)
    end
  end

  describe "異常系" do
    it "存在しない id は not found エラーを返す" do
      data = execute_delete({ id: "0" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "削除済みを再度削除すると not found エラーを返す" do
      discarded = create(:wordbook, :official, :discarded)

      data = execute_delete({ id: discarded.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "自作（personal）単語帳は対象外（公式のみ）" do
      personal = create(:wordbook)

      data = execute_delete({ id: personal.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(personal.reload.discarded?).to be(false)
    end
  end

  describe "認可" do
    it "一般ユーザーは削除できない（success:false / system エラー / top-level errors 無し）" do
      user = create(:user)
      wordbook = create(:wordbook, :official)

      result = execute_graphql(
        mutation, variables: { id: wordbook.id.to_s }, context: { current_user: user }
      )
      data = result.dig("data", "deleteAdminWordbook")

      expect(result["errors"]).to be_nil
      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.discarded?).to be(false)
    end

    it "未認証は削除できない" do
      wordbook = create(:wordbook, :official)

      data = execute_delete({ id: wordbook.id.to_s }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.discarded?).to be(false)
    end
  end
end
