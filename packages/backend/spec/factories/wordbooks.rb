FactoryBot.define do
  factory :wordbook do
    sequence(:title) { |n| "単語帳#{n}" }
    kind { :personal }
    association :user

    # 公式単語帳（user を持たない）
    trait :official do
      kind { :official }
      user { nil }
    end

    # 論理削除済み
    trait :discarded do
      deleted_at { Time.current }
    end
  end
end
