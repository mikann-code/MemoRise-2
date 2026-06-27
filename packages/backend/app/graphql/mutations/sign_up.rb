module Mutations
  # 新規登録（名前・メール・パスワード）。
  # User 作成時に after_create で「はじめての単語帳」が自動生成される（User モデル）。
  # 作成後はそのままセッションへ載せて自動ログインし、作成したユーザーを返す。
  class SignUp < BaseMutation
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true

    field :user, Types::UserType, null: false

    def resolve(name:, email:, password:)
      user = User.create!(name: name, email: email, password: password)
      session[:user_id] = user.id

      { user: user }
    end
  end
end
