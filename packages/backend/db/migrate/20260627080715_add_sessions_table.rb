# DB セッションストア（activerecord-session_store）が使うセッションテーブル。
# Cookie には session_id のみを載せ、user_id 等の実体はこの data に保持する。
class AddSessionsTable < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.string :session_id, null: false
      t.text :data
      t.timestamps
    end

    add_index :sessions, :session_id, unique: true
    add_index :sessions, :updated_at
  end
end
