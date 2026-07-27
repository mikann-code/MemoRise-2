require "rails_helper"

RSpec.describe Resolvers::MyWordbooks do
  let(:query) do
    <<~GQL
      query {
        myWordbooks { id title description label kind wordsCount lastStudied }
      }
    GQL
  end

  # user 作成時に「はじめての単語帳」が自動生成される点に注意（sign_up_spec 参照）。
  let!(:user) { create(:user) }

  describe "正常系" do
    it "自分の自作単語帳のみを最近学習した順で返す" do
      older = create(:wordbook, user: user, title: "英単語")
      newer = create(:wordbook, user: user, title: "IT 用語")
      older.update_columns(last_studied: 2.days.ago)
      newer.update_columns(last_studied: 1.hour.ago)

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "myWordbooks").map { |w| w["title"] }

      # 未学習（はじめての単語帳）は学習済みの後ろへ回る
      expect(titles).to eq([ "IT 用語", "英単語", "はじめての単語帳" ])
    end

    it "未学習の単語帳同士は新しく作った順に並べる" do
      create(:wordbook, user: user, title: "先に作った帳")
      create(:wordbook, user: user, title: "後から作った帳")

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "myWordbooks").map { |w| w["title"] }

      expect(titles).to eq([ "後から作った帳", "先に作った帳", "はじめての単語帳" ])
    end

    it "自由入力ラベル・説明・単語数を返す" do
      wordbook = create(:wordbook, user: user, title: "英単語", description: "説明文", label: "IT")
      create(:word, wordbook: wordbook)

      result = execute_graphql(query, context: { current_user: user })
      wb = result.dig("data", "myWordbooks").find { |w| w["title"] == "英単語" }

      expect(wb["description"]).to eq("説明文")
      expect(wb["label"]).to eq("IT")
      expect(wb["kind"]).to eq("personal")
      expect(wb["wordsCount"]).to eq(1)
      expect(wb["lastStudied"]).to be_nil
    end
  end

  describe "認可・異常系" do
    it "他人の自作単語帳は含めない（current_user スコープ）" do
      other = create(:user)
      create(:wordbook, user: other, title: "他人の帳")

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "myWordbooks").map { |w| w["title"] }

      expect(titles).not_to include("他人の帳")
    end

    it "公式（official）単語帳は含めない" do
      create(:wordbook, :official, title: "公式帳")

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "myWordbooks").map { |w| w["title"] }

      expect(titles).not_to include("公式帳")
    end

    it "論理削除された自作単語帳は除外する" do
      create(:wordbook, user: user, title: "削除済").discard!

      result = execute_graphql(query, context: { current_user: user })
      titles = result.dig("data", "myWordbooks").map { |w| w["title"] }

      expect(titles).not_to include("削除済")
    end

    it "未認証は UNAUTHORIZED" do
      result = execute_graphql(query)

      expect(result.dig("data", "myWordbooks")).to be_nil
      expect(result.dig("errors", 0, "extensions", "code")).to eq("UNAUTHORIZED")
    end
  end
end
