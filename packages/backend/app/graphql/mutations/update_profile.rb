module Mutations
  # プロフィール編集（本人のみ）。名前は必須、パスワードは任意（変更するときだけ送る）。
  # パスワードを変更する場合は確認用と一致していることを検証する（不一致は errors で返す）。
  # 認可失敗・入力エラーは例外ではなく {success, errors} 方式で返す（docs/backend.md §4）。
  class UpdateProfile < BaseMutation
    argument :name, String, required: true
    argument :password, String, required: false, description: "変更するときだけ指定（8 文字以上）"
    argument :password_confirmation, String, required: false, description: "password 指定時の確認用"

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :user, Types::UserType, null: true

    def resolve(name:, password: nil, password_confirmation: nil)
      return failure(unauthorized_errors) unless current_user

      user = current_user
      user.name = name

      if password.present?
        return failure(password_mismatch_errors) if password != password_confirmation

        user.password = password
      end

      return failure(validation_errors(user)) unless user.valid?

      user.save!

      { success: true, errors: [], user: user }
    end

    private

    def failure(errors)
      { success: false, errors: errors, user: nil }
    end

    def unauthorized_errors
      [ { field: "system", message: "認証が必要です" } ]
    end

    def password_mismatch_errors
      [ { field: "passwordConfirmation", message: "パスワード（確認）が一致しません" } ]
    end

    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end
  end
end
