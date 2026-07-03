module Types
  # 単語。公式単語帳の閲覧では question / answer を読み取り専用で返す。
  class WordType < Types::BaseObject
    field :id, ID, null: false
    field :question, String, null: false
    field :answer, String, null: false
  end
end
