require "rails_helper"

RSpec.describe StudyDetail, type: :model do
  it { is_expected.to belong_to(:study_record) }
  it { is_expected.to belong_to(:chapter_wordbook).class_name("Wordbook").optional }

  describe "バリデーション" do
    it { is_expected.to validate_presence_of(:total_count) }
    it { is_expected.to validate_presence_of(:correct_count) }
  end

  describe "correct_not_exceed_count" do
    it "正答数が問題数を超えると無効" do
      detail = build(:study_detail, total_count: 5, correct_count: 6)

      expect(detail).to be_invalid
      expect(detail.errors[:correct_count]).to be_present
    end

    it "正答数 == 問題数は有効" do
      detail = build(:study_detail, total_count: 5, correct_count: 5)
      expect(detail).to be_valid
    end

    it "正答数 < 問題数は有効" do
      detail = build(:study_detail, total_count: 10, correct_count: 3)
      expect(detail).to be_valid
    end
  end
end
