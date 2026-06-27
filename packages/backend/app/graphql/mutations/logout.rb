module Mutations
  # ログアウト。ログイン状態に関わらず常に成功を返す（冪等／攻撃者にログイン状態を知らせない）。
  # reset_session でセッションを破棄し、sessions テーブルのレコードも削除する。
  class Logout < BaseMutation
    field :success, Boolean, null: false

    def resolve
      context[:controller].reset_session

      { success: true }
    end
  end
end
