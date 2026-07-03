module Types
  class MutationType < Types::BaseObject
    # 認証（一般ユーザー）
    field :sign_up, mutation: Mutations::SignUp, description: "新規登録（名前・メール・パスワード）"
    field :login, mutation: Mutations::Login, description: "ログイン（メール・パスワード）"
    field :logout, mutation: Mutations::Logout, description: "ログアウト（セッション破棄・冪等）"

    # 認証（管理者）。一般ユーザーとスコープを分離する。ログアウトは冪等な logout を共用する。
    field :admin_login, mutation: Mutations::AdminLogin, description: "管理者ログイン（メール・パスワード）"

    # 公式単語帳の管理（管理者専用）。閲覧は Query 側の publicWordbooks / publicWordbook。
    field :create_admin_wordbook, mutation: Mutations::CreateAdminWordbook,
      description: "公式単語帳の作成（管理者専用。parentId 指定で章を作成）"
    field :update_admin_wordbook, mutation: Mutations::UpdateAdminWordbook,
      description: "公式単語帳の更新（管理者専用。親の label / level 変更は章へ伝播）"
    field :delete_admin_wordbook, mutation: Mutations::DeleteAdminWordbook,
      description: "公式単語帳の削除（管理者専用・論理削除）"

    # 動作確認用プレースホルダ（疎通テストで使用）。
    field :noop, Boolean, null: false, description: "プレースホルダ"

    def noop
      true
    end
  end
end
