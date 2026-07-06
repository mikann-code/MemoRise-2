# frozen_string_literal: true

require "rails_helper"

RSpec.describe Resolvers::AdminWordbook do
  let(:query) do
    <<~GQL
      query AdminWordbook($id: ID!) {
        adminWordbook(id: $id) {
          id title parentId
          children { id title orderIndex }
          words { id question answer }
        }
      }
    GQL
  end

  let(:admin) { create(:user, :admin) }

  def execute(id, context: { current_admin: admin })
    execute_graphql(query, variables: { id: id.to_s }, context: context)
  end

  describe "正常系" do
    it "教材を渡すと章（children）を order_index 昇順で返す" do
      parent = create(:wordbook, :official, title: "TOEIC")
      create(:wordbook, :official, parent_id: parent.id, title: "第2章", order_index: 2)
      create(:wordbook, :official, parent_id: parent.id, title: "第1章", order_index: 1)

      data = execute(parent.id).dig("data", "adminWordbook")
      expect(data["title"]).to eq("TOEIC")
      expect(data["parentId"]).to be_nil
      expect(data["children"].map { |c| c["title"] }).to eq([ "第1章", "第2章" ])
    end

    it "章を渡すと単語（words）を返す" do
      parent = create(:wordbook, :official)
      chapter = create(:wordbook, :official, parent_id: parent.id, order_index: 1)
      create(:word, wordbook: chapter, user: nil, question: "apple", answer: "りんご")

      data = execute(chapter.id).dig("data", "adminWordbook")
      expect(data["parentId"]).to eq(parent.id.to_s)
      expect(data["words"].map { |w| w["question"] }).to eq([ "apple" ])
    end

    it "自作・論理削除済み・存在しない id は null" do
      personal = create(:wordbook, title: "自作")
      discarded = create(:wordbook, :official, :discarded)

      expect(execute(personal.id).dig("data", "adminWordbook")).to be_nil
      expect(execute(discarded.id).dig("data", "adminWordbook")).to be_nil
      expect(execute(0).dig("data", "adminWordbook")).to be_nil
    end
  end

  describe "認可" do
    it "一般ユーザーは FORBIDDEN" do
      user = create(:user)
      parent = create(:wordbook, :official)

      result = execute(parent.id, context: { current_user: user })
      expect(result.dig("errors", 0, "extensions", "code")).to eq("FORBIDDEN")
    end
  end
end
