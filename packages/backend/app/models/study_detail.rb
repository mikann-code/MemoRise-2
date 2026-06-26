class StudyDetail < ApplicationRecord
  belongs_to :study_record
  # 学習した子単語帳（章）への参照。章が消えても記録は残す（nullify）。
  belongs_to :chapter_wordbook, class_name: "Wordbook", optional: true

  validates :total_count, presence: true,
                          numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :correct_count, presence: true,
                            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :correct_not_exceed_count

  private

  # 正答数は問題数（total_count）を超えない。
  def correct_not_exceed_count
    return if correct_count.nil? || total_count.nil?

    if correct_count > total_count
      errors.add(:correct_count, "は問題数を超えることはできません")
    end
  end
end
