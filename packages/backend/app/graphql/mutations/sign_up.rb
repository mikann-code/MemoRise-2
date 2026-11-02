module Mutations
  # 新規登録（名前・メール・パスワード）。
  # 入力エラーは例外ではなく errors 配列で返す（{success, errors} 方式に統一）。
  # User 作成時に after_create で「はじめての単語帳」が自動生成される（User モデル）。
  # 同じ IP からの登録件数に上限を設ける（アカウントの大量作成対策）。
  # 成功時はセッション ID を作り直してから自動ログインし、作成したユーザーを返す。
  class SignUp < BaseMutation
    # 同じ IP から 1 時間に 10 件まで。
    SIGN_UP_LIMIT = 10
    SIGN_UP_WINDOW = 1.hour

    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :user, Types::UserType, null: true

    def resolve(name:, email:, password:)
      sign_ups_key = "sign_ups:#{context[:remote_ip]}"

      if attempts_exceeded?(sign_ups_key, SIGN_UP_LIMIT)
        return { success: false, errors: too_many_attempts_errors, user: nil }
      end

      user = User.new(name: name, email: email, password: password)

      unless user.valid?
        return { success: false, errors: validation_errors(user), user: nil }
      end

      user.save!
      record_attempt(sign_ups_key, SIGN_UP_WINDOW)
      sign_in(user)

      { success: true, errors: [], user: user }
    end

    private

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    def validation_errors(user)
      user.errors.map { |e| { field: e.attribute.to_s, message: e.full_message } }
    end
  end
end
