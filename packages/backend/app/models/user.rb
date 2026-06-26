class User < ApplicationRecord
  has_secure_password

  # 一般ユーザーと管理者を同一テーブルで管理する（ログイン Mutation は別系統）。
  enum :role, { user: "user", admin: "admin" }, default: "user"

  has_many :wordbooks, dependent: :destroy
  has_many :words, dependent: :destroy
  has_many :study_records, dependent: :destroy
  has_many :user_word_tags, dependent: :destroy
  has_many :user_wordbook_progresses, dependent: :destroy

  # 保存前に email を正規化（前後空白除去 + 小文字化）。
  # DB の照合順序が ci（大小無視）なので、アプリ側も大小無視で揃える。
  # normalizesは「弾く」のではなく「変換する」
  normalizes :email, with: ->(email) { email.strip.downcase }

  # 大小を無視して比較し、重複を省く
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, allow_nil: true

  # 初回の空画面を防ぐため、一般ユーザー登録時に「はじめての単語帳」を自動生成する。
  # 管理者には作らない。
  after_create :create_default_wordbook, if: :user?

  # 連続学習日数を更新する。
  #   - 今日すでに更新済みなら何もしない（二度押し冪等）
  #   - 昨日学習済みなら +1、そうでなければ 1 にリセット
  # validation / callback を介さない軽量更新（update_columns）。updated_at も明示更新する。
  def update_streak!
    today = Time.zone.today
    return if last_study_date == today

    new_streak = (last_study_date == today - 1) ? streak + 1 : 1
    update_columns(streak: new_streak, last_study_date: today, updated_at: Time.current)
  end

  # 連続が途切れていたら streak を 0 に戻す（ログイン時などに呼ぶ）。
  #   - 既に 0（未学習含む）なら何もしない（無駄な書き込み回避・冪等）
  #   - 最終学習日が今日 or 昨日なら継続中とみなして維持（昨日は当日学習で繋がる猶予）
  #   - 一昨日以前なら途切れとみなして 0
  # last_study_date 自体は実際の最終学習日として保持する（書き換えない）。
  def refresh_streak!
    return if streak.zero?
    return if last_study_date && last_study_date >= Time.zone.today - 1

    update_columns(streak: 0, updated_at: Time.current)
  end

  private

  def create_default_wordbook
    wordbooks.create!(title: "はじめての単語帳")
  end
end
