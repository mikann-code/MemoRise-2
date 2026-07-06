# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mutations::ImportCsv do
  let(:mutation) do
    <<~GQL
      mutation ImportCsv($wordbookId: ID!, $csv: String!) {
        importCsv(wordbookId: $wordbookId, csv: $csv) {
          success
          errors { field message }
          importedCount
          wordbook { id wordsCount }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }
  # 単語を登録できるのは章（子単語帳）のみ。教材（親）は入れ物なので拒否される。
  let(:parent) { create(:wordbook, :official) }
  let(:wordbook) { create(:wordbook, :official, parent: parent) }

  def execute_import(csv, wordbook_id: wordbook.id.to_s, context: { current_admin: admin })
    execute_graphql(mutation, variables: { wordbookId: wordbook_id, csv: csv }, context: context)
      .dig("data", "importCsv")
  end

  describe "正常系" do
    it "全行を一括登録する" do
      data = execute_import("apple,りんご\nbanana,バナナ\n")

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      expect(data["importedCount"]).to eq(2)
      expect(data.dig("wordbook", "wordsCount")).to eq(2)
      expect(wordbook.words.pluck(:question)).to contain_exactly("apple", "banana")
    end

    it "空行はスキップする" do
      data = execute_import("apple,りんご\n\nbanana,バナナ\n")

      expect(data["success"]).to be(true)
      expect(data["importedCount"]).to eq(2)
    end
  end

  describe "部分失敗（行番号付きエラー）" do
    it "不正な行は行番号付きでエラーに載せ、正常な行は登録する" do
      # 2 行目は answer が欠落 → バリデーションエラー
      data = execute_import("apple,りんご\nbanana\ncherry,さくらんぼ\n")

      expect(data["success"]).to be(false)
      expect(data["importedCount"]).to eq(2)
      expect(data["errors"].length).to eq(1)
      expect(data.dig("errors", 0, "field")).to eq("csv")
      expect(data.dig("errors", 0, "message")).to start_with("2行目")
      expect(wordbook.words.pluck(:question)).to contain_exactly("apple", "cherry")
    end

    it "登録できる行が無ければ success:false" do
      data = execute_import("\n\n")

      expect(data["success"]).to be(false)
      expect(data["importedCount"]).to eq(0)
      expect(data.dig("errors", 0, "field")).to eq("csv")
    end
  end

  describe "異常系・認可" do
    it "自作単語帳には登録できない（wordbookId エラー）" do
      personal = create(:wordbook)

      data = execute_import("a,い", wordbook_id: personal.id.to_s)

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
    end

    it "教材（親単語帳）には登録できない（wordbookId エラー）" do
      data = execute_import("a,い", wordbook_id: parent.id.to_s)

      expect(data["success"]).to be(false)
      expect(data["importedCount"]).to eq(0)
      expect(data.dig("errors", 0, "field")).to eq("wordbookId")
      expect(parent.words.count).to eq(0)
    end

    it "一般ユーザーは登録できない（system エラー）" do
      user = create(:user)

      data = execute_import("a,い", context: { current_user: user })

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
      expect(wordbook.words.count).to eq(0)
    end
  end
end
