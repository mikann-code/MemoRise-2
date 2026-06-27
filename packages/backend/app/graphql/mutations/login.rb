module Mutations
  # ログイン（メール・パスワード）。
  # 一般ユーザー（role: user）のみ受け付け、管理者は別系統（#6 の adminLogin）に分離する。
  # 認証情報が一致しなければ UNAUTHORIZED（メール存在の有無は秘匿して同一メッセージにする）。
  # 成功時はセッションへ user_id を載せてログイン状態にする。
  class Login < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    field :user, Types::UserType, null: false

    def resolve(email:, password:)
      user = User.find_by(email: email.to_s.strip.downcase)

      unless user&.user? && user.authenticate(password)
        raise Errors::Unauthorized.new("メールアドレスまたはパスワードが正しくありません")
      end

      session[:user_id] = user.id

      { user: user }
    end
  end
end
