class Wordbook < ApplicationRecord
  # 公式単語帳のラベル分類（許可する値の集合）。official のカテゴリ分け（英検 / TOEIC 等）に使う。
  # 「値として何が正しいか」＝ドメイン整合性の源泉はここ。inclusion で未知ラベルの保存を弾く
  # （未知ラベルはフロントのどのセクションにも入らず一覧から消えるため、DB 側で防ぐ）。
  # 表示名・並び順はプレゼンの関心なのでフロント（packages/frontend/src/constants/wordbookLabels.ts）が持つ。
  # 任意項目（自作単語帳は nil）で、値 "official" が kind と衝突するため enum ではなく定数＋inclusion で扱う。
  LABELS = %w[junior_high high_school eiken toeic toefl daily official].freeze

  # 公式単語帳の難易度レベル（許可する値の集合）。同じ label（英検 / TOEIC 等）の中で
  # 教材を段階分け（基礎 → 標準 → 発展）し、同カテゴリ内で挑戦度を選び分けるために使う。
  # label と同じく「値として何が正しいか」＝ドメイン整合性の源泉はここ。inclusion で未知の値を弾く。
  # 表示名（基礎 / 標準 / 発展）はプレゼンの関心なのでフロント（constants/wordbookLevels.ts）が持つ。
  LEVELS = %w[basic standard advanced].freeze

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
  # label は任意。official はカテゴリ分類なので LABELS のいずれかに限定する。
  # personal は v1 と同じ自由入力（例: 英語 / IT / TOEIC）のため inclusion を掛けない。
  validates :label, inclusion: { in: LABELS }, allow_nil: true, if: :official?
  # level も任意。official は難易度の段階分類なので LEVELS のいずれかに限定する
  # （personal は level を使わないため対象外）。
  validates :level, inclusion: { in: LEVELS }, allow_nil: true, if: :official?

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
  # 章（parent_id あり）は一意制約 (parent_id, order_index) の席を占有し続けると
  # 同じ並び順での再作成を DB レベルでブロックするため、論理削除時に order_index を
  # NULL にして席を明け渡す（復元時は order_index を振り直す運用）。
  # 親（parent_id: nil）は PostgreSQL が NULL を含む組を重複とみなさず席が競合しないため、
  # 並び順（order_index）を保持したまま復元できるように残す。
  def discard!
    return if discarded?

    freed = parent_id.present? ? { order_index: nil } : {}
    update_columns(deleted_at: Time.current, updated_at: Time.current, **freed)
  end

  def undiscard!
    return unless discarded?

    update_columns(deleted_at: nil, updated_at: Time.current)
  end

  # 単語一覧を開いたときに最終閲覧日時を記録する（単語帳一覧の「最近開いた順」と時刻表示の元）。
  # カラム名は last_studied のままだが、更新契機はテスト完了ではなく閲覧（openWordbook）。
  # discard! と同じく validation / callback を介さない軽量更新（update_columns）。
  def touch_studied!
    update_columns(last_studied: Time.current, updated_at: Time.current)
  end
end
