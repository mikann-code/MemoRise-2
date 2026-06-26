FactoryBot.define do
  factory :user_wordbook_progress do
    association :user
    association :wordbook
    completed { false }
  end
end
