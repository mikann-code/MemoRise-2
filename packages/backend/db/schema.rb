# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_17_000007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "study_details", force: :cascade do |t|
    t.bigint "chapter_wordbook_id"
    t.integer "correct_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "rate", default: 0, null: false
    t.bigint "study_record_id", null: false
    t.string "title"
    t.integer "total_count", null: false
    t.datetime "updated_at", null: false
    t.index ["chapter_wordbook_id"], name: "index_study_details_on_chapter_wordbook_id"
    t.index ["study_record_id"], name: "index_study_details_on_study_record_id"
  end

  create_table "study_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "memo"
    t.integer "study_count", default: 0, null: false
    t.date "study_date", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "study_date"], name: "index_study_records_on_user_id_and_study_date", unique: true
    t.index ["user_id"], name: "index_study_records_on_user_id"
  end

  create_table "user_word_tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "tag", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "word_id", null: false
    t.index ["user_id", "word_id", "tag"], name: "index_user_word_tags_on_user_id_and_word_id_and_tag", unique: true
    t.index ["user_id"], name: "index_user_word_tags_on_user_id"
    t.index ["word_id"], name: "index_user_word_tags_on_word_id"
  end

  create_table "user_wordbook_progresses", force: :cascade do |t|
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "wordbook_id", null: false
    t.index ["user_id", "wordbook_id"], name: "index_user_wordbook_progresses_on_user_id_and_wordbook_id", unique: true
    t.index ["user_id"], name: "index_user_wordbook_progresses_on_user_id"
    t.index ["wordbook_id"], name: "index_user_wordbook_progresses_on_wordbook_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.date "last_study_date"
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "user", null: false
    t.integer "streak", default: 0, null: false
    t.datetime "updated_at", null: false
    t.integer "words_count", default: 0, null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
  end

  create_table "wordbooks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.string "kind", default: "personal", null: false
    t.string "label"
    t.datetime "last_studied"
    t.string "level"
    t.integer "order_index"
    t.bigint "parent_id"
    t.string "part"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.integer "words_count", default: 0, null: false
    t.index ["deleted_at"], name: "index_wordbooks_on_deleted_at"
    t.index ["parent_id", "order_index"], name: "index_wordbooks_on_parent_id_and_order_index", unique: true
    t.index ["parent_id", "part"], name: "index_wordbooks_on_parent_id_and_part", unique: true
    t.index ["parent_id"], name: "index_wordbooks_on_parent_id"
    t.index ["user_id"], name: "index_wordbooks_on_user_id"
  end

  create_table "words", force: :cascade do |t|
    t.string "answer", null: false
    t.datetime "created_at", null: false
    t.string "question", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "wordbook_id", null: false
    t.index ["user_id"], name: "index_words_on_user_id"
    t.index ["wordbook_id"], name: "index_words_on_wordbook_id"
  end

  add_foreign_key "study_details", "study_records", on_delete: :cascade
  add_foreign_key "study_details", "wordbooks", column: "chapter_wordbook_id", on_delete: :nullify
  add_foreign_key "study_records", "users", on_delete: :cascade
  add_foreign_key "user_word_tags", "users", on_delete: :cascade
  add_foreign_key "user_word_tags", "words", on_delete: :cascade
  add_foreign_key "user_wordbook_progresses", "users", on_delete: :cascade
  add_foreign_key "user_wordbook_progresses", "wordbooks", on_delete: :cascade
  add_foreign_key "wordbooks", "users", on_delete: :cascade
  add_foreign_key "wordbooks", "wordbooks", column: "parent_id", on_delete: :cascade
  add_foreign_key "words", "users", on_delete: :cascade
  add_foreign_key "words", "wordbooks", on_delete: :cascade
end
