module Mutations
  # Mutation の基底クラス。引数をフラットに受け取る非 Relay 形式
  # （GraphQL::Schema::Mutation）。base 系のフィールド／引数クラスを差し込む。
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    private

    def current_user
      context[:current_user]
    end

    def current_admin
      context[:current_admin]
    end

    # ログイン状態を保持・破棄するためのセッション（DB セッションストア）。
    def session
      context[:session]
    end

    # 一般ユーザー必須の Mutation で使う。未認証なら UNAUTHORIZED。
    def require_user!
      current_user || raise(Errors::Unauthorized.new)
    end
  end
end
