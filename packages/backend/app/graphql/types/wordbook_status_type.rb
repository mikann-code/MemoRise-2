module Types
  # 公式単語帳（教材）の公開状態。値の集合は Wordbook の Rails enum が源泉で、
  # GraphQL 側は「未知の文字列を受け付けない入力型」としてこの enum を使う。
  class WordbookStatusType < Types::BaseEnum
    graphql_name "WordbookStatus"

    value "DRAFT", "下書き（一般ユーザーからは存在しないものとして扱う）", value: "draft"
    value "PUBLISHED", "公開中（一般ユーザーに表示される）", value: "published"
  end
end
