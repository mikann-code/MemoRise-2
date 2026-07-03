module Mutations
  # ログアウト。ログイン状態に関わらず常に成功を返す（冪等／攻撃者にログイン状態を知らせない）。
  # reset_session でセッションを破棄し、sessions テーブルのレコードも削除する。
  # errors は他ミューテーションと形を揃えるため常に空配列で返す。
  class Logout < BaseMutation
    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false

    def resolve
      context[:controller].reset_session

      { success: true, errors: [] }
    end
  end
end
