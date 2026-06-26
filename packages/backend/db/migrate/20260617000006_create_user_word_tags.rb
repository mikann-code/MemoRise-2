class CreateUserWordTags < ActiveRecord::Migration[8.1]
  def change
    create_table :user_word_tags do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :word, null: false, foreign_key: { on_delete: :cascade }
      t.string :tag, null: false

      t.timestamps
    end

    # 同じ単語の二重タグを防止する。
    add_index :user_word_tags, [ :user_id, :word_id, :tag ], unique: true
  end
end
