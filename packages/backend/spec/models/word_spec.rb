require "rails_helper"

RSpec.describe Word, type: :model do
  describe "バリデーション" do
    subject { build(:word) }

    it { is_expected.to validate_presence_of(:question) }
    it { is_expected.to validate_presence_of(:answer) }
  end

  describe "関連と counter_cache" do
    it { is_expected.to belong_to(:wordbook).counter_cache(true) }
    it { is_expected.to belong_to(:user).optional.counter_cache(true) }

    it "自作単語の作成で wordbook.words_count と user.words_count が増える" do
      user = create(:user)
      wordbook = create(:wordbook, user: user)

      expect {
        create(:word, wordbook: wordbook, user: user)
      }.to change { wordbook.reload.words_count }.by(1)
        .and change { user.reload.words_count }.by(1)
    end
  end

  describe "user_consistency / 所有者継承" do
    it "公式単語帳に user 付き単語は不可" do
      official = create(:wordbook, :official)
      word = build(:word, wordbook: official, user: create(:user))

      expect(word).to be_invalid
      expect(word.errors[:user_id]).to be_present
    end

    it "公式単語帳 + user なしは有効" do
      official = create(:wordbook, :official)
      word = build(:word, wordbook: official, user: nil)

      expect(word).to be_valid
    end

    it "自作単語帳で user 省略時は wordbook の owner を継承する" do
      user = create(:user)
      mine = create(:wordbook, user: user)
      word = create(:word, wordbook: mine, user: nil)

      expect(word.user_id).to eq(user.id)
      expect(word).to be_valid
    end

    it "自作単語帳で owner と異なる user は不可" do
      owner = create(:user)
      other = create(:user)
      mine = create(:wordbook, user: owner)
      word = build(:word, wordbook: mine, user: other)

      expect(word).to be_invalid
      expect(word.errors[:user_id]).to be_present
    end

    it "自作単語帳 + 所有者は有効" do
      user = create(:user)
      mine = create(:wordbook, user: user)
      word = build(:word, wordbook: mine, user: user)

      expect(word).to be_valid
    end
  end

  describe "物理削除（単語1件）" do
    it "destroy で wordbook.words_count / user.words_count が減る" do
      user = create(:user)
      wordbook = create(:wordbook, user: user)
      word = create(:word, wordbook: wordbook, user: user)

      expect { word.destroy }
        .to change { wordbook.reload.words_count }.by(-1)
        .and change { user.reload.words_count }.by(-1)
    end
  end
end
