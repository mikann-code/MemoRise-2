class CreateWords < ActiveRecord::Migration[8.1]
  def change
    create_table :words do |t|
      t.string :question, null: false
      t.string :answer, null: false
      # 復習フラグは per-user の状態（誰が復習対象にしているか）なので
      # words には持たせず、user_word_tags（tag: "review"）で表現する。
      t.references :wordbook, null: false, foreign_key: { on_delete: :cascade }
      t.references :user, null: true, foreign_key: { on_delete: :cascade }

      t.timestamps
    end
  end
end
