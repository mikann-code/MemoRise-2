require "rails_helper"

RSpec.describe StudyRecord, type: :model do
  subject { build(:study_record) }

  it { is_expected.to belong_to(:user) }
  it { is_expected.to have_many(:study_details).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:study_date) }

  it "同一ユーザー・同一日付は一意（1 日 1 レコード）" do
    user = create(:user)
    create(:study_record, user: user, study_date: Time.zone.today)
    dup = build(:study_record, user: user, study_date: Time.zone.today)

    expect(dup).to be_invalid
    expect(dup.errors[:study_date]).to be_present
  end

  it "ユーザーが違えば同じ日付でも作成できる" do
    create(:study_record, user: create(:user), study_date: Time.zone.today)
    other = build(:study_record, user: create(:user), study_date: Time.zone.today)

    expect(other).to be_valid
  end
end
