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

    add_index :users, :email, unique: true
  end
end
