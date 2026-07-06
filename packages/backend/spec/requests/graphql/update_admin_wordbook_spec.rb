# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::UpdateAdminWordbook do
  let(:mutation) do
    <<~GQL
      mutation UpdateAdminWordbook(
        $id: ID!, $title: String, $description: String, $label: String,
        $level: String, $orderIndex: Int
      ) {
        updateAdminWordbook(
          id: $id, title: $title, description: $description, label: $label,
          level: $level, orderIndex: $orderIndex
        ) {
          success
          errors { field message }
          wordbook { id title description label level orderIndex }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  def execute_update(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "updateAdminWordbook")
  end

  describe "正常系" do
    it "渡した項目のみを部分更新する（未指定の項目は変えない）" do
      wordbook = create(:wordbook, :official, title: "旧タイトル", label: "toeic", level: "初級")

      data = execute_update({ id: wordbook.id.to_s, title: "新タイトル", description: "新説明" })

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])

      wordbook.reload
      expect(wordbook.title).to eq("新タイトル")
      expect(wordbook.description).to eq("新説明")
      expect(wordbook.label).to eq("toeic")
      expect(wordbook.level).to eq("初級")
    end

    it "親の label / level 変更は子（章）へ伝播する（論理削除済みの章にも）" do
      parent = create(:wordbook, :official, label: "eiken", level: "3")
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1,
                       label: "eiken", level: "3")
      discarded_chapter = create(:wordbook, :official, :discarded, parent_id: parent.id,
                                 label: "eiken", level: "3")

      data = execute_update({ id: parent.id.to_s, label: "toeic", level: "600" })

      expect(data["success"]).to be(true)
      expect(chapter.reload.label).to eq("toeic")
      expect(chapter.level).to eq("600")
      expect(discarded_chapter.reload.label).to eq("toeic")
      expect(discarded_chapter.level).to eq("600")
    end

    it "親の title 更新だけでは子へ伝播しない" do
      parent = create(:wordbook, :official, label: "eiken")
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1, label: "eiken")

      execute_update({ id: parent.id.to_s, title: "改題" })

      expect(chapter.reload.title).not_to eq("改題")
      expect(chapter.label).to eq("eiken")
    end

    it "章（子）自体の更新もできる" do
      parent = create(:wordbook, :official)
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1)

      data = execute_update({ id: chapter.id.to_s, title: "改題した章", orderIndex: 2 })

      expect(data["success"]).to be(true)
      expect(chapter.reload.title).to eq("改題した章")
      expect(chapter.order_index).to eq(2)
    end
  end

  describe "異常系" do
    it "存在しない id は not found エラーを返す" do
      data = execute_update({ id: "0", title: "x" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "自作（personal）単語帳は対象外（公式のみ）" do
      personal = create(:wordbook, title: "自作帳")

      data = execute_update({ id: personal.id.to_s, title: "乗っ取り" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(personal.reload.title).to eq("自作帳")
    end

    it "論理削除済みは対象外" do
      discarded = create(:wordbook, :official, :discarded)

      data = execute_update({ id: discarded.id.to_s, title: "x" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "同じ親の中で orderIndex が重複する更新は system エラーを返す" do
      parent = create(:wordbook, :official)
      create(:wordbook, :official, parent_id: parent.id, order_index: 1)
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 2)

      data = execute_update({ id: chapter.id.to_s, orderIndex: 1 })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end

    it "title を明示的に null にするとバリデーションエラーを返す" do
      wordbook = create(:wordbook, :official, title: "旧タイトル")

      data = execute_update({ id: wordbook.id.to_s, title: nil })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("title")
      expect(wordbook.reload.title).to eq("旧タイトル")
    end
  end

  describe "認可" do
    it "一般ユーザーは更新できない（success:false / system エラー / top-level errors 無し）" do
      user = create(:user)
      wordbook = create(:wordbook, :official, title: "旧タイトル")

      result = execute_graphql(
        mutation,
        variables: { id: wordbook.id.to_s, title: "改ざん" },
        context: { current_user: user }
      )
      data = result.dig("data", "updateAdminWordbook")

      expect(result["errors"]).to be_nil
      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.title).to eq("旧タイトル")
    end
  end
end
