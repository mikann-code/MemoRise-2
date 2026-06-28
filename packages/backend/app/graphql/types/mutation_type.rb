module Types
  class MutationType < Types::BaseObject
    # 認証（一般ユーザー）
    field :sign_up, mutation: Mutations::SignUp, description: "新規登録（名前・メール・パスワード）"
    field :login, mutation: Mutations::Login, description: "ログイン（メール・パスワード）"
    field :logout, mutation: Mutations::Logout, description: "ログアウト（セッション破棄・冪等）"

    # 動作確認用プレースホルダ（疎通テストで使用）。
    field :noop, Boolean, null: false, description: "プレースホルダ"

    def noop
      true
    end
  end
end
