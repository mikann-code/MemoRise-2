module Mutations
  # 新規登録（名前・メール・パスワード）。
  # 入力エラーは例外ではなく errors 配列で返す（{success, errors} 方式に統一）。
  # User 作成時に after_create で「はじめての単語帳」が自動生成される（User モデル）。
  # 成功時はそのままセッションへ載せて自動ログインし、作成したユーザーを返す。
  class SignUp < BaseMutation
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :user, Types::UserType, null: true

    def resolve(name:, email:, password:)
      user = User.new(name: name, email: email, password: password)

      unless user.valid?
        return { success: false, errors: validation_errors(user), user: nil }
      end

      user.save!
      session[:user_id] = user.id

      { success: true, errors: [], user: user }
    end

    private

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    def validation_errors(user)
      user.errors.map { |e| { field: e.attribute.to_s, message: e.full_message } }
    end
  end
end
