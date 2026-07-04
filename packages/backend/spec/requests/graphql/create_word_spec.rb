require "rails_helper"

RSpec.describe Mutations::CreateWord do
  let(:mutation) do
    <<~GQL
      mutation CreateWord($wordbookId: ID!, $question: String!, $answer: String!) {
        createWord(wordbookId: $wordbookId, question: $question, answer: $answer) {
          success
          errors { field message }
          word { id question answer }
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let!(:wordbook) { create(:wordbook, user: user) }

  def execute_create(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "createWord")
  end

  describe "正常系" do
    it "自分の単語帳に単語を追加し、所有者を引き継ぐ" do
      expect {
        @data = execute_create(
          { wordbookId: wordbook.id.to_s, question: "apple", answer: "りんご" }
        )
      }.to change(wordbook.words, :count).by(1)

      expect(@data["success"]).to be(true)
      expect(@data["errors"]).to eq([])
      expect(@data.dig("word", "question")).to eq("apple")

      created = Word.find(@data.dig("word", "id"))
      expect(created.user_id).to eq(user.id)
    end

    it "words_count（counter_cache）が単語帳・ユーザーとも増える" do
      execute_create({ wordbookId: wordbook.id.to_s, question: "book", answer: "本" })

      expect(wordbook.reload.words_count).to eq(1)
      expect(user.reload.words_count).to eq(1)
    end
  end

  describe "異常系" do
    it "question が空ならバリデーションエラーを返し、作成しない" do
      expect {
        @data = execute_create({ wordbookId: wordbook.id.to_s, question: "", answer: "りんご" })
      }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data["errors"].map { |e| e["field"] }).to include("question")
    end

    it "answer が空ならバリデーションエラーを返し、作成しない" do
      expect {
        @data = execute_create({ wordbookId: wordbook.id.to_s, question: "apple", answer: "" })
      }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data["errors"].map { |e| e["field"] }).to include("answer")
    end
  end

  describe "認可" do
    it "他人の単語帳には追加できない（wordbookId エラー）" do
      other_wordbook = create(:wordbook, user: create(:user))

      expect {
        @data = execute_create(
          { wordbookId: other_wordbook.id.to_s, question: "q", answer: "a" }
        )
      }.not_to change(Word, :count)

      expect(@data["success"]).to be(false)
      expect(@data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "公式（official）単語帳には追加できない（wordbookId エラー）" do
      official = create(:wordbook, :official)

      data = execute_create({ wordbookId: official.id.to_s, question: "q", answer: "a" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "論理削除済みの単語帳には追加できない（wordbookId エラー）" do
      wordbook.discard!

      data = execute_create({ wordbookId: wordbook.id.to_s, question: "q", answer: "a" })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "未認証は追加できない（system エラー）" do
      data = execute_create(
        { wordbookId: wordbook.id.to_s, question: "q", answer: "a" }, context: {}
      )

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
