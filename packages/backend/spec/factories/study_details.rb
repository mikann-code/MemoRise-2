FactoryBot.define do
  factory :study_detail do
    association :study_record
    title { "Day 1" }
    rate { 80 }
    total_count { 10 }
    correct_count { 8 }
  end
end
