class CreateUserWordbookProgresses < ActiveRecord::Migration[8.1]
  def change
    create_table :user_wordbook_progresses do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :wordbook, null: false, foreign_key: { on_delete: :cascade }
      t.boolean :completed, null: false, default: false

      t.timestamps
    end

    add_index :user_wordbook_progresses, [ :user_id, :wordbook_id ], unique: true
  end
end
