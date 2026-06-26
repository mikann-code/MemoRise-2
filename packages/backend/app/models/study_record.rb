class StudyRecord < ApplicationRecord
  belongs_to :user
  has_many :study_details, dependent: :destroy

  validates :study_date, presence: true
  # 1 日 1 レコードに集約する。
  validates :study_date, uniqueness: { scope: :user_id }
end
