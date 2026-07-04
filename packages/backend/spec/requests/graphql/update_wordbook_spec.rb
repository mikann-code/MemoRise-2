require "rails_helper"

RSpec.describe Mutations::UpdateWordbook do
  let(:mutation) do
    <<~GQL
      mutation UpdateWordbook($id: ID!, $title: String, $description: String, $label: String) {
        updateWordbook(id: $id, title: $title, description: $description, label: $label) {
          success
          errors { field message }
          wordbook { id title description label }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user, title: "旧タイトル", description: "旧説明", label: "旧ラベル") }

  def execute_update(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "updateWordbook")
  end

  describe "正常系" do
    it "タイトル・説明・ラベルを更新する" do
      data = execute_update(
        { id: wordbook.id.to_s, title: "新タイトル", description: "新説明", label: "IT" }
      )

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])

      wordbook.reload
      expect(wordbook.title).to eq("新タイトル")
      expect(wordbook.description).to eq("新説明")
      expect(wordbook.label).to eq("IT")
    end

    it "指定したフィールドのみ更新する（部分更新）" do
      execute_update({ id: wordbook.id.to_s, title: "新タイトル" })

      wordbook.reload
      expect(wordbook.title).to eq("新タイトル")
      expect(wordbook.description).to eq("旧説明")
      expect(wordbook.label).to eq("旧ラベル")
    end

    it "ラベルを空文字にすると未設定（null）に戻す" do
      data = execute_update({ id: wordbook.id.to_s, label: "" })

      expect(data["success"]).to be(true)
      expect(wordbook.reload.label).to be_nil
    end
  end

  describe "異常系" do
    it "title を空にするとバリデーションエラーを返し、更新しない" do
      data = execute_update({ id: wordbook.id.to_s, title: "" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("title")
      expect(wordbook.reload.title).to eq("旧タイトル")
    end
  end

  describe "認可" do
    it "他人の自作単語帳は更新できない（not found）" do
      other_wordbook = create(:wordbook, user: create(:user), title: "他人の帳")

      data = execute_update({ id: other_wordbook.id.to_s, title: "乗っ取り" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(other_wordbook.reload.title).to eq("他人の帳")
    end

    it "公式（official）単語帳は更新できない（not found）" do
      official = create(:wordbook, :official, title: "公式帳")

      data = execute_update({ id: official.id.to_s, title: "改ざん" })

      expect(data["success"]).to be(false)
      expect(official.reload.title).to eq("公式帳")
    end

    it "論理削除済みは更新できない（not found）" do
      wordbook.discard!

      data = execute_update({ id: wordbook.id.to_s, title: "復活させない" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "未認証は更新できない（system エラー）" do
      data = execute_update({ id: wordbook.id.to_s, title: "新" }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.reload.title).to eq("旧タイトル")
    end
  end
end
