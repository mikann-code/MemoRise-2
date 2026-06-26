class CreateStudyRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :study_records do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.date :study_date, null: false
      t.integer :study_count, null: false, default: 0
      t.text :memo

      t.timestamps
    end

    # 1 日 1 行に集約する（[user_id, study_date] で UNIQUE）。
    add_index :study_records, [ :user_id, :study_date ], unique: true
  end
end
