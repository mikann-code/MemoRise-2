class Word < ApplicationRecord
  belongs_to :wordbook, counter_cache: true
  belongs_to :user, optional: true, counter_cache: true

  # 自作単語帳の単語の所有者は、単語帳の owner から継承する（非正規化の一貫性担保）。
  before_validation :inherit_user_from_wordbook, on: :create

  validates :question, presence: true
  validates :answer, presence: true
  validate :user_consistency

  private

  def inherit_user_from_wordbook
    return if wordbook.nil? || wordbook.official?

    # wordbookのuser_idを継承
    self.user_id ||= wordbook.user_id
  end

  # 公式単語帳には user_id 付き単語は不可。
  # 自作単語帳の単語は所有者が単語帳の owner と一致しなければならない
  # （users.words_count や join なし認可のための非正規化を一貫させる）。
  def user_consistency
    return if wordbook.nil?

    if wordbook.official?
      errors.add(:user_id, "公式単語帳の単語にユーザーを紐付けることはできません") if user_id.present?
    elsif user_id.blank?
      errors.add(:user_id, "自作単語帳の単語にはユーザーが必要です")
    elsif user_id != wordbook.user_id
      errors.add(:user_id, "は単語帳の所有者と一致する必要があります")
    end
  end
end
