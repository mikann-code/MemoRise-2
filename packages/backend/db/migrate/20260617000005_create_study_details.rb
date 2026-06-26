class CreateStudyDetails < ActiveRecord::Migration[8.1]
  def change
    create_table :study_details do |t|
      t.references :study_record, null: false, foreign_key: { on_delete: :cascade }
      t.string :title
      # rate は correct_count / total_count から導出可能な「その回の正答率キャッシュ」。
      t.integer :rate, null: false, default: 0
      # count は ActiveRecord のメソッドと衝突するため total_count を採用。
      t.integer :total_count, null: false
      t.integer :correct_count, null: false, default: 0
      # 学習した子単語帳（章）への参照。章が削除されても記録は残すため nullify。
      t.references :chapter_wordbook, null: true,
                   foreign_key: { to_table: :wordbooks, on_delete: :nullify }

      t.timestamps
    end
  end
end
