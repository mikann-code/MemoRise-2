module Types
  # 学習記録の種類。復習テストを「単語帳なし」という消去法でなく明示的な値で表し、
  # 引数の組み合わせ不正（REVIEW + wordbookId 等）を検出できるようにする。
  class StudyRecordKindType < Types::BaseEnum
    graphql_name "StudyRecordKind"

    value "WORDBOOK", "単語帳のテスト（wordbookId 必須。自作は本人のみ・公式は章を指定）", value: "wordbook"
    value "REVIEW", "復習専用テスト（wordbookId 不可）", value: "review"
  end
end
