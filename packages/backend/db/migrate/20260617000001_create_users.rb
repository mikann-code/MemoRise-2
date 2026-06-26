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

      t.timestamps
    end

    # email は normalizes で小文字化して保存するため、大小無視で一意にする。
    # Postgres は既定で大小区別なので、LOWER(email) の関数インデックスで
    # 大小無視のユニークを担保する（MySQL の ci 照合に相当）。
    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"
  end
end
