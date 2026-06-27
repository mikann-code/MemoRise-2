module Resolvers
  # Resolver の基底クラス。認可コンテキスト（current_user / current_admin）の
  # 読み出しと、フィールド冒頭で使うガードを提供する（docs/backend.md 参照）。
  class BaseResolver < GraphQL::Schema::Resolver
    argument_class(Types::BaseArgument)

    private

    def current_user
      context[:current_user]
    end

    def current_admin
      context[:current_admin]
    end

    # 一般ユーザー必須のフィールドで使う。未認証なら UNAUTHORIZED。
    def require_user!
      current_user || raise(Errors::Unauthorized.new)
    end

    # 管理者必須のフィールドで使う。管理者でなければ FORBIDDEN。
    def require_admin!
      current_admin || raise(Errors::Forbidden.new)
    end
  end
end
