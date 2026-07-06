class CreateWordbooks < ActiveRecord::Migration[8.1]
  def change
    create_table :wordbooks do |t|
      t.string :title, null: false
      t.text :description
      # 親レコード（ユーザー）が削除された場合に、子レコードも削除される on_delete: :cascade
      t.references :user, foreign_key: { on_delete: :cascade }, null: true
      # 種類。official = 公式 / personal = 自作。boolean ではなく enum 管理（将来 shared 等に拡張可）。
      t.string :kind, null: false, default: "personal"
      t.references :parent, foreign_key: { to_table: :wordbooks, on_delete: :cascade }, null: true
      t.string :label
      t.string :level
      t.integer :order_index
      t.datetime :last_studied
      t.integer :words_count, null: false, default: 0
      # 論理削除（NULL = 有効 / 値あり = 削除済み）。単語帳のみ論理削除し復元可能にする。
      t.datetime :deleted_at

      t.timestamps
    end

    # 同一親内（章）の順序衝突を DB レベルで防止する。
    # 章番号は持たない（表示番号は order_index 順の並び位置からフロントで導出する）。
    add_index :wordbooks, [ :parent_id, :order_index ], unique: true
    # kept / discarded スコープの絞り込み用。
    add_index :wordbooks, :deleted_at
  end
end
