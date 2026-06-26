class UserWordbookProgress < ApplicationRecord
  belongs_to :user
  belongs_to :wordbook

  # 章の解放はレコードの存在で表現する（[user_id, wordbook_id] で UNIQUE）。
  validates :wordbook_id, uniqueness: { scope: :user_id }
end
