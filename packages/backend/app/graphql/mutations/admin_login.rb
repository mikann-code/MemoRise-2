module Mutations
  # 管理者ログイン（メール・パスワード）。
  # 管理者（role: admin）のみ受け付け、一般ユーザーは締め出す（スコープ分離。一般は #5 の login）。
  # 認証情報が一致しなければ UNAUTHORIZED（メール存在の有無は秘匿して同一メッセージにする）。
  # 成功時はセッションへ user_id を載せてログイン状態にする（セッション基盤は一般と共通・画面空間は分離）。
  class AdminLogin < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :user, Types::UserType, null: false

    def resolve(email:, password:)
      user = User.find_by(email: email.to_s.strip.downcase)

      unless user&.admin? && user.authenticate(password)
        raise Errors::Unauthorized.new("メールアドレスまたはパスワードが正しくありません")
      end

      session[:user_id] = user.id

      { user: user }
    end
  end
end
