require "rails_helper"

RSpec.describe Mutations::UpdateWord do
  let(:mutation) do
    <<~GQL
      mutation UpdateWord($id: ID!, $question: String, $answer: String) {
        updateWord(id: $id, question: $question, answer: $answer) {
          success
          errors { field message }
          word { id question answer }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user) }
  let!(:word) { create(:word, wordbook: wordbook, question: "apple", answer: "りんご") }

  def execute_update(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "updateWord")
  end

  describe "正常系" do
    it "単語と意味を更新する" do
      data = execute_update({ id: word.id.to_s, question: "banana", answer: "バナナ" })

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])

      word.reload
      expect(word.question).to eq("banana")
      expect(word.answer).to eq("バナナ")
    end

    it "指定したフィールドのみ更新する（部分更新）" do
      execute_update({ id: word.id.to_s, answer: "林檎" })

      word.reload
      expect(word.question).to eq("apple")
      expect(word.answer).to eq("林檎")
    end
  end

  describe "異常系" do
    it "question を空にするとバリデーションエラーを返し、更新しない" do
      data = execute_update({ id: word.id.to_s, question: "" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("question")
      expect(word.reload.question).to eq("apple")
    end
  end

  describe "認可" do
    it "他人の単語は更新できない（not found）" do
      other_word = create(:word, wordbook: create(:wordbook, user: create(:user)), question: "q")

      data = execute_update({ id: other_word.id.to_s, question: "乗っ取り" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
      expect(other_word.reload.question).to eq("q")
    end

    it "公式単語帳の単語は更新できない（not found）" do
      official_word = create(:word, :official)

      data = execute_update({ id: official_word.id.to_s, question: "改ざん" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "論理削除済み単語帳の単語は更新できない（not found）" do
      wordbook.discard!

      data = execute_update({ id: word.id.to_s, question: "変更" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("id")
    end

    it "未認証は更新できない（system エラー）" do
      data = execute_update({ id: word.id.to_s, question: "変更" }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
