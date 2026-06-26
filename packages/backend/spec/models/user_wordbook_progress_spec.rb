require "rails_helper"

RSpec.describe UserWordbookProgress, type: :model do
  subject { build(:user_wordbook_progress) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:wordbook) }

  it "[user, wordbook] の組み合わせは一意" do
    user = create(:user)
    wordbook = create(:wordbook, :official)
    create(:user_wordbook_progress, user: user, wordbook: wordbook)
    dup = build(:user_wordbook_progress, user: user, wordbook: wordbook)

    expect(dup).to be_invalid
  end
end
