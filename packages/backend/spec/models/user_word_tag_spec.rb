require "rails_helper"

RSpec.describe UserWordTag, type: :model do
  subject { build(:user_word_tag) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:word) }
  it { is_expected.to validate_presence_of(:tag) }

  it "[user, word, tag] の組み合わせは一意" do
    user = create(:user)
    word = create(:word)
    create(:user_word_tag, user: user, word: word, tag: "review")
    dup = build(:user_word_tag, user: user, word: word, tag: "review")

    expect(dup).to be_invalid
  end

  it "tag が異なれば同じ単語に複数タグ付けできる" do
    user = create(:user)
    word = create(:word)
    create(:user_word_tag, user: user, word: word, tag: "review")
    other = build(:user_word_tag, user: user, word: word, tag: "later")

    expect(other).to be_valid
  end
end
