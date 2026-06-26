FactoryBot.define do
  factory :word do
    sequence(:question) { |n| "question#{n}" }
    answer { "答え" }
    # デフォルトは自作単語帳 + その所有ユーザー（user_consistency を満たす）
    association :wordbook
    user { wordbook&.user }

    # 公式単語帳の単語（user を持たない）
    trait :official do
      association :wordbook, factory: [ :wordbook, :official ]
      user { nil }
    end
  end
end
