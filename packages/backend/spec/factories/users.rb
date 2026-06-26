FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "テストユーザー" }
    password { "password" }

    # 管理者ユーザー
    trait :admin do
      sequence(:email) { |n| "admin#{n}@example.com" }
      name { "管理者" }
      role { :admin }
    end
  end
end
