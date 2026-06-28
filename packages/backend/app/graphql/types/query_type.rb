module Types
  class QueryType < Types::BaseObject
    # ログイン中の一般ユーザー。未認証なら null を返す（フロントはこれで未認証を判定する）。
    field :me, Types::UserType, null: true, description: "ログイン中の一般ユーザー（未認証なら null）"

    # ログイン中の管理者。管理者でなければ（role 不一致・未認証とも）null を返す。
    # フロントの管理者ガードはこれで判定し、null なら /admin-login へリダイレクトする。
    field :admin_me, Types::UserType, null: true, description: "ログイン中の管理者（管理者でなければ null）"

    # 動作確認用フィールド。
    field :health, String, null: false, description: "API 稼働確認用"

    def me
      context[:current_user]
    end

    def admin_me
      context[:current_admin]
    end

    def health
      "MemoRise GraphQL API is running"
    end
  end
end
