require "rails_helper"

RSpec.describe Wordbook, type: :model do
  describe "バリデーション" do
    subject { build(:wordbook) }

    it { is_expected.to validate_presence_of(:title) }
  end

  describe "関連" do
    it { is_expected.to belong_to(:user).optional }
    it { is_expected.to belong_to(:parent).class_name("Wordbook").optional }
    it { is_expected.to have_many(:children).class_name("Wordbook").dependent(:destroy) }
    it { is_expected.to have_many(:words).dependent(:destroy) }
  end

  describe "kind enum（公式 / 自作 / 共有）" do
    it {
      is_expected.to define_enum_for(:kind)
        .with_values(official: "official", personal: "personal", shared: "shared")
        .backed_by_column_of_type(:string)
    }

    it "既定値は personal" do
      expect(Wordbook.new.kind).to eq("personal")
    end
  end

  describe "自己参照（親子）" do
    it "親に子をぶら下げられる" do
      parent = create(:wordbook, :official)
      child = create(:wordbook, :official, parent: parent, part: "Day 1", order_index: 1)
      expect(parent.children).to include(child)
      expect(child.parent).to eq(parent)
    end
  end

  describe "ユニーク制約 [parent_id, order_index]（DB レベル）" do
    it "同一親で order_index が重複すると保存できない" do
      parent = create(:wordbook, :official)
      create(:wordbook, :official, parent: parent, order_index: 1, part: "A")
      # validate: false で挿入し、[parent_id, order_index] の一意制約に確実に当てる。
      dup = build(:wordbook, :official, parent: parent, order_index: 1, part: "B")

      expect { dup.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "論理削除（self のみ）" do
    let(:user) { create(:user) }
    let(:wordbook) { create(:wordbook, user: user) }

    it "#discard! で deleted_at が入り、kept から外れて discarded に入る" do
      expect { wordbook.discard! }.to change { wordbook.reload.discarded? }.from(false).to(true)
      expect(Wordbook.kept).not_to include(wordbook)
      expect(Wordbook.discarded).to include(wordbook)
    end

    it "#discard! しても配下の words は残す（復元のため）" do
      word = create(:word, wordbook: wordbook, user: user)
      expect { wordbook.discard! }.not_to change(Word, :count)
      expect(Word.exists?(word.id)).to be(true)
    end

    it "#discard! は冪等（二度呼んでも deleted_at は変わらない）" do
      wordbook.discard!
      first = wordbook.reload.deleted_at
      wordbook.discard!
      expect(wordbook.reload.deleted_at).to eq(first)
    end

    it "#undiscard! で復元できる" do
      wordbook.discard!
      expect { wordbook.undiscard! }.to change { wordbook.reload.discarded? }.from(true).to(false)
      expect(Wordbook.kept).to include(wordbook)
    end

    it "親を discard! しても子（章）は連動しない（self のみ）" do
      parent = create(:wordbook, :official)
      child = create(:wordbook, :official, parent: parent, part: "Day 1", order_index: 1)
      parent.discard!
      expect(child.reload.discarded?).to be(false)
    end
  end
end
