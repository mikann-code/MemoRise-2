module Mutations
  # 管理者ログイン（メール・パスワード）。
  # 管理者（role: admin）のみ受け付け、一般ユーザーは締め出す（スコープ分離。一般は login）。
  # 認証失敗は例外ではなく errors 配列で返す（{success, errors} 方式に統一）。
  # メール存在の有無は秘匿し、失敗は原因に関わらず同一メッセージにする（列挙攻撃対策）。
  # 同じメールアドレスで失敗が続いたら一定時間受け付けない（総当たり対策。上限は BaseMutation）。
  # 成功時はセッション ID を作り直してから user_id を載せ、ログイン状態にする
  # （セッション基盤は一般と共通・画面空間は分離）。
  class AdminLogin < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :user, Types::UserType, null: true

    def resolve(email:, password:)
      email = email.to_s.strip.downcase
      failures_key = login_failures_key(email)

      if attempts_exceeded?(failures_key, LOGIN_FAILURE_LIMIT)
        return { success: false, errors: too_many_attempts_errors, user: nil }
      end

      user = User.find_by(email: email)

      unless user&.admin? && user.authenticate(password)
        record_attempt(failures_key, LOGIN_FAILURE_WINDOW)
        return { success: false, errors: invalid_credentials, user: nil }
      end

      reset_attempts(failures_key)
      sign_in(user)

      { success: true, errors: [], user: user }
    end

    private

    # 認証失敗。メール存在を秘匿するため、原因に関わらず同一の system エラーを返す。
    def invalid_credentials
      [ { field: "system", message: "メールアドレスまたはパスワードが正しくありません" } ]
    end
  end
end
