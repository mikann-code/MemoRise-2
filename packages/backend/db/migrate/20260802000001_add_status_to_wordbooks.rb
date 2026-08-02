# 公式単語帳（教材）の公開状態。draft = 下書き（一般ユーザーに見せない）/ published = 公開中。
# 既定を published にすることで、既存レコード・自作（personal）・seed をすべて公開扱いのまま移行する
# （下書きは作成時に明示する）。粒度は教材（親）単位で、章は親の値を伝播で持つ。
class AddStatusToWordbooks < ActiveRecord::Migration[8.1]
  def change
    add_column :wordbooks, :status, :string, null: false, default: "published"
    # draft / published スコープの絞り込み用（一般ユーザー向けクエリが毎回通る）。
    add_index :wordbooks, :status
  end
end
