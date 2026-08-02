# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::SetAdminWordbookStatus do
  let(:mutation) do
    <<~GQL
      mutation SetAdminWordbookStatus($id: ID!, $status: WordbookStatus!) {
        setAdminWordbookStatus(id: $id, status: $status) {
          success
          errors { field message }
          wordbook { id title status }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  def execute_set_status(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "setAdminWordbookStatus")
  end

  describe "正常系" do
    it "下書きの教材を公開できる" do
      wordbook = create(:wordbook, :official, :draft, title: "TOEIC")

      data = execute_set_status({ id: wordbook.id.to_s, status: "PUBLISHED" })

      expect(data["success"]).to be(true)
      expect(data.dig("wordbook", "status")).to eq("PUBLISHED")
      expect(wordbook.reload).to be_published
    end

    it "公開中の教材を下書きに戻せる" do
      wordbook = create(:wordbook, :official, title: "TOEIC")

      data = execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(true)
      expect(data.dig("wordbook", "status")).to eq("DRAFT")
      expect(wordbook.reload).to be_draft
    end

    it "章（子）へ伝播する" do
      parent = create(:wordbook, :official)
      ch1 = create(:wordbook, :official, parent_id: parent.id, order_index: 1)
      ch2 = create(:wordbook, :official, parent_id: parent.id, order_index: 2)

      data = execute_set_status({ id: parent.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(true)
      expect(ch1.reload).to be_draft
      expect(ch2.reload).to be_draft
    end

    it "論理削除済みの章にも伝播する（復元時に親とずれないように）" do
      parent = create(:wordbook, :official)
      discarded_chapter = create(:wordbook, :official, :discarded, parent_id: parent.id)

      execute_set_status({ id: parent.id.to_s, status: "DRAFT" })

      expect(discarded_chapter.reload).to be_draft
    end

    it "同じ状態を二度指定しても成功する（冪等）" do
      wordbook = create(:wordbook, :official, :draft)

      execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" })
      data = execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(true)
      expect(wordbook.reload).to be_draft
    end
  end

  describe "異常系" do
    it "章（子）は対象外で not found を返す（切り替えは教材単位）" do
      parent = create(:wordbook, :official)
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1)

      data = execute_set_status({ id: chapter.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(chapter.reload).to be_published
    end

    it "自作（personal）単語帳は not found を返す" do
      wordbook = create(:wordbook)

      data = execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(wordbook.reload).to be_published
    end

    it "論理削除済みの教材は not found を返す" do
      wordbook = create(:wordbook, :official, :discarded)

      data = execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "存在しない ID は not found を返す" do
      data = execute_set_status({ id: "0", status: "DRAFT" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "enum に無い値はスキーマレベルで弾く" do
      wordbook = create(:wordbook, :official)

      result = execute_graphql(
        mutation,
        variables: { id: wordbook.id.to_s, status: "ARCHIVED" },
        context: { current_admin: admin }
      )

      expect(result["errors"]).to be_present
      expect(wordbook.reload).to be_published
    end
  end

  describe "認可" do
    it "未認証は切り替えできない（success:false / system エラー）" do
      wordbook = create(:wordbook, :official)

      data = execute_set_status({ id: wordbook.id.to_s, status: "DRAFT" }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload).to be_published
    end

    it "一般ユーザーは切り替えできない（success:false / system エラー / top-level errors 無し）" do
      user = create(:user)
      wordbook = create(:wordbook, :official)

      result = execute_graphql(
        mutation,
        variables: { id: wordbook.id.to_s, status: "DRAFT" },
        context: { current_user: user }
      )
      data = result.dig("data", "setAdminWordbookStatus")

      expect(result["errors"]).to be_nil
      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload).to be_published
    end
  end
end
