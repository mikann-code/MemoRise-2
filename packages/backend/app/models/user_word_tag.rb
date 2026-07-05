class UserWordTag < ApplicationRecord
  # 復習タグの値。テストの誤答時の自動登録・手動のタグ付けはすべてこの値で扱う
  # （tag カラム自体は将来の別タグ用に汎用のまま残す）。
  REVIEW = "review".freeze

  belongs_to :user
  belongs_to :word

  validates :tag, presence: true
  # 同じ単語の二重タグを防止する。
  validates :word_id, uniqueness: { scope: [ :user_id, :tag ] }
end
