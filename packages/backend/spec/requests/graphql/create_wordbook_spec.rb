require "rails_helper"

RSpec.describe Mutations::CreateWordbook do
  let(:mutation) do
    <<~GQL
      mutation CreateWordbook($title: String!, $description: String, $label: String) {
        createWordbook(title: $title, description: $description, label: $label) {
          success
          errors { field message }
          wordbook { id title description label kind }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }

  def execute_create(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "createWordbook")
  end

  describe "正常系" do
    it "本人所有の personal 単語帳を作成する" do
      expect {
        @data = execute_create({ title: "英単語", description: "説明", label: "IT" })
      }.to change(user.wordbooks, :count).by(1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(@data.dig("wordbook", "kind")).to eq("personal")

      created = Wordbook.find(@data.dig("wordbook", "id"))
      expect(created.user_id).to eq(user.id)
      expect(created.personal?).to be(true)
      expect(created.label).to eq("IT")
    end

    it "ラベルは自由入力できる（LABELS 制限は official のみ）" do
      data = execute_create({ title: "帳", label: "自作カテゴリ" })

      expect(data["success"]).to be(true)
      expect(data.dig("wordbook", "label")).to eq("自作カテゴリ")
    end

    it "ラベルが空文字なら未設定（null）として保存する" do
      data = execute_create({ title: "帳", label: "" })

      expect(data["success"]).to be(true)
      expect(data.dig("wordbook", "label")).to be_nil
    end
  end

  describe "異常系" do
    it "title が空ならバリデーションエラーを返し、作成しない" do
      expect {
        @data = execute_create({ title: "" })
      }.not_to change(Wordbook, :count)

      expect(@data["success"]).to be(false)
      expect(@data["wordbook"]).to be_nil
      expect(@data["errors"].map { |e| e["field"] }).to include("title")
    end
  end

  describe "認可" do
    it "未認証は作成できない（success:false / system エラー）" do
      expect {
        @data = execute_create({ title: "帳" }, context: {})
      }.not_to change(Wordbook, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
