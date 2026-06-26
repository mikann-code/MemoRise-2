FactoryBot.define do
  factory :study_record do
    association :user
    study_date { Time.zone.today }
    study_count { 1 }
  end
end
