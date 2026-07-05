module Types
  # 公式単語帳の章（子）の解放状態。解放はレコードの存在で表現するため、
  # このオブジェクトが返る＝その章は解放済み。completed はテスト完了フラグ。
  class WordbookProgressType < Types::BaseObject
    field :id, ID, null: false
    field :wordbook_id, ID, null: false, description: "対象の章（子単語帳）の ID"
    field :completed, Boolean, null: false, description: "その章のテストを完了したか"
  end
end
