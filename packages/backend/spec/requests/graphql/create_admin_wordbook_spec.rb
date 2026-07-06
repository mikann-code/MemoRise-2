# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::CreateAdminWordbook do
  let(:mutation) do
    <<~GQL
      mutation CreateAdminWordbook(
        $title: String!, $description: String, $label: String, $level: String,
        $parentId: ID, $orderIndex: Int
      ) {
        createAdminWordbook(
          title: $title, description: $description, label: $label, level: $level,
          parentId: $parentId, orderIndex: $orderIndex
        ) {
          success
          errors { field message }
          wordbook { id title label level orderIndex kind }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  def execute_create(variables, context: { current_admin: admin })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "createAdminWordbook")
  end

  describe "正常系" do
    it "親（教材）を公式単語帳として作成する" do
      data = execute_create(
        { title: "TOEIC 基礎", description: "説明", label: "toeic", level: "basic" }
      )

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      expect(data.dig("wordbook", "kind")).to eq("official")

      created = Wordbook.find(data.dig("wordbook", "id"))
      expect(created.official?).to be(true)
      expect(created.user_id).to be_nil
      expect(created.parent_id).to be_nil
      expect(created.label).to eq("toeic")
    end

    it "親の作成時に既定の章「第1章」を 1 つ自動作成する（label / level は親を引き継ぐ）" do
      data = execute_create({ title: "TOEIC 基礎", label: "toeic", level: "basic" })

      created = Wordbook.find(data.dig("wordbook", "id"))
      expect(created.children.count).to eq(1)
      chapter = created.children.first
      expect(chapter.title).to eq("第1章")
      expect(chapter.order_index).to eq(1)
      expect(chapter.label).to eq("toeic")
      expect(chapter.level).to eq("basic")
      expect(chapter.official?).to be(true)
      expect(chapter.user_id).to be_nil
    end

    it "parentId 指定で章（子）を作成し、label / level 省略時は親から引き継ぐ" do
      parent = create(:wordbook, :official, label: "eiken", level: "basic")

      data = execute_create(
        { title: "第1章", parentId: parent.id.to_s, orderIndex: 1 }
      )

      expect(data["success"]).to be(true)
      created = Wordbook.find(data.dig("wordbook", "id"))
      expect(created.parent_id).to eq(parent.id)
      expect(created.label).to eq("eiken")
      expect(created.level).to eq("basic")
      expect(created.order_index).to eq(1)
      # 既定の章の自動作成は親の作成時のみ（章の下に章は作らない）
      expect(created.children).to be_empty
    end

    it "論理削除済みの章と同じ orderIndex で章を再作成できる（席の明け渡し）" do
      parent = create(:wordbook, :official)
      create(:wordbook, :official, parent: parent, order_index: 1).discard!

      data = execute_create(
        { title: "第1章（作り直し）", parentId: parent.id.to_s, orderIndex: 1 }
      )

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      expect(data.dig("wordbook", "orderIndex")).to eq(1)
    end
  end

  describe "異常系" do
    it "title が空ならバリデーションエラーを返す" do
      data = execute_create({ title: "" })

      expect(data["success"]).to be(false)
      expect(data["wordbook"]).to be_nil
      expect(data["errors"].map { |e| e["field"] }).to include("title")
    end

    it "label が許可外の値ならバリデーションエラーを返す" do
      data = execute_create({ title: "帳", label: "unknown_label" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("label")
    end

    it "parentId が存在しない場合は parentId エラーを返す" do
      data = execute_create({ title: "第1章", parentId: "0" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("parentId")
    end

    it "章（子）を親には指定できない（階層は親→章の 2 段まで）" do
      parent = create(:wordbook, :official)
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1)

      data = execute_create({ title: "孫", parentId: chapter.id.to_s })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("parentId")
    end

    it "同じ親の中で orderIndex が重複する場合は system エラーを返す" do
      parent = create(:wordbook, :official)
      create(:wordbook, :official, parent_id: parent.id, order_index: 1)

      data = execute_create({ title: "重複章", parentId: parent.id.to_s, orderIndex: 1 })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end

  describe "認可" do
    it "一般ユーザーは作成できない（success:false / system エラー / top-level errors 無し）" do
      user = create(:user)

      result = execute_graphql(
        mutation, variables: { title: "帳" }, context: { current_user: user }
      )
      data = result.dig("data", "createAdminWordbook")

      expect(result["errors"]).to be_nil
      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(Wordbook.official.count).to eq(0)
    end

    it "未認証は作成できない" do
      data = execute_create({ title: "帳" }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(Wordbook.official.count).to eq(0)
    end
  end
end
