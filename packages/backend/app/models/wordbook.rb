class Wordbook < ApplicationRecord
  # 単語帳の種類。
  # official = 公式（運営が用意 / user_id なし）、
  # personal = 自作（ユーザー所有 / user_id あり）、
  # shared   = 共有（将来用に種類だけ定義。現状この kind を作る機能は未実装）。
  # boolean ではなく enum 管理なので、種類追加は 1 行で済む。
  # official? / personal? / shared? 述語と同名スコープが自動生成される。
  enum :kind, { official: "official", personal: "personal", shared: "shared" }, default: "personal"

  # user_id: nil = 公式 / 値あり = 自作
  belongs_to :user, optional: true
  # 自己参照（親 = TOEIC 等、子 = Day/章）
  belongs_to :parent, class_name: "Wordbook", optional: true
  has_many :children, class_name: "Wordbook", foreign_key: :parent_id, dependent: :destroy
  # 物理削除（destroy）時のみ words も削除する。論理削除（discard!）では words は残す。
  has_many :words, dependent: :destroy

  validates :title, presence: true

  # --- 論理削除（self のみ） ---
  # 単語帳を「ゴミ箱」に入れる方式。deleted_at に印を付けるだけで words は消さないため、
  # undiscard! で中身ごと復元できる。一覧表示では .kept で削除済みを除外する。
  # 親子（章）への連鎖は現状の要件では不要なので self のみを対象にする。
  scope :kept, -> { where(deleted_at: nil) }
  scope :discarded, -> { where.not(deleted_at: nil) }

  def discarded?
    deleted_at.present?
  end

  # validation / callback を介さない軽量更新（User#update_streak! と同じ方針）。
  # updated_at も明示的に更新する。
  def discard!
    return if discarded?

    update_columns(deleted_at: Time.current, updated_at: Time.current)
  end

  def undiscard!
    return unless discarded?

    update_columns(deleted_at: nil, updated_at: Time.current)
  end
end
