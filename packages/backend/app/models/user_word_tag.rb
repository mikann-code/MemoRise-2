class UserWordTag < ApplicationRecord
  belongs_to :user
  belongs_to :word

  validates :tag, presence: true
  # 同じ単語の二重タグを防止する。
  validates :word_id, uniqueness: { scope: [ :user_id, :tag ] }
end
