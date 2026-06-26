FactoryBot.define do
  factory :user_word_tag do
    association :user
    association :word
    tag { "review" }
  end
end
