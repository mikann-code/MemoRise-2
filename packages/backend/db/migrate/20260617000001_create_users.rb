class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :name, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "user"
      t.integer :streak, null: false, default: 0
      t.date :last_study_date
      t.integer :words_count, null: false, default: 0

      # サインアップ時のメール本人確認（Devise Confirmable 相当の最小構成）。
      #   confirmation_token   … 確認リンクで照合するトークン
      #   confirmation_sent_at … 送信時刻（有効期限・再送のレート制限に使う）
      #   confirmed_at         … 確認完了時刻（NULL = 未確認のフラグを兼ねる）
      t.string :confirmation_token
      t.datetime :confirmation_sent_at
      t.datetime :confirmed_at

      t.timestamps
    end

    # トークン照合の検索用 + 重複防止。Postgres は複数 NULL を許容するため
    # 未確認（token 未発行）のユーザー同士は衝突しない。
    add_index :users, :confirmation_token, unique: true

    # email は normalizes で小文字化して保存するため、大小無視で一意にする。
    # Postgres は既定で大小区別なので、LOWER(email) の関数インデックスで
    # 大小無視のユニークを担保する（MySQL の ci 照合に相当）。
    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"
  end
end
