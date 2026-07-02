module Mutations
  # ログイン（メール・パスワード）。
  # 一般ユーザー（role: user）のみ受け付け、管理者は別系統（adminLogin）に分離する。
  # 認証失敗は例外ではなく errors 配列で返す（{success, errors} 方式に統一）。
  # メール存在の有無は秘匿し、失敗は原因に関わらず同一メッセージにする（列挙攻撃対策）。
  # 成功時はセッションへ user_id を載せてログイン状態にする。
  class Login < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :user, Types::UserType, null: true

    def resolve(email:, password:)
      user = User.find_by(email: email.to_s.strip.downcase)

      unless user&.user? && user.authenticate(password)
        return { success: false, errors: invalid_credentials, user: nil }
      end

      session[:user_id] = user.id

      { success: true, errors: [], user: user }
    end

    private

    # 認証失敗。メール存在を秘匿するため、原因に関わらず同一の system エラーを返す。
    def invalid_credentials
      [ { field: "system", message: "メールアドレスまたはパスワードが正しくありません" } ]
    end
  end
end
