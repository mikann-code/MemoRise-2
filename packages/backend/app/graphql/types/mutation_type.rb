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

    # 自作単語帳の CRUD（一般ユーザー専用）。閲覧は Query 側の myWordbooks / myWordbook。
    field :create_wordbook, mutation: Mutations::CreateWordbook,
      description: "自作単語帳の作成（要ログイン）"
    field :update_wordbook, mutation: Mutations::UpdateWordbook,
      description: "自作単語帳の更新（本人のみ）"
    field :delete_wordbook, mutation: Mutations::DeleteWordbook,
      description: "自作単語帳の削除（本人のみ・論理削除。単語は残す）"

    # 自作単語帳の単語 CRUD（一般ユーザー専用）。
    field :create_word, mutation: Mutations::CreateWord,
      description: "自作単語帳への単語の追加（本人のみ）"
    field :update_word, mutation: Mutations::UpdateWord,
      description: "単語の更新（本人のみ）"
    field :delete_word, mutation: Mutations::DeleteWord,
      description: "単語の削除（本人のみ・物理削除）"

    # 復習タグ（一般ユーザー専用）。閲覧は Query 側の taggedWords。
    field :add_tagged_word, mutation: Mutations::AddTaggedWord,
      description: "単語へ復習タグを付ける（本人の単語・公式の単語。冪等）"
    field :remove_tagged_word, mutation: Mutations::RemoveTaggedWord,
      description: "単語の復習タグを外す（本人のタグのみ・冪等）"

    # 学習記録（一般ユーザー専用）。
    field :create_study_record, mutation: Mutations::CreateStudyRecord,
      description: "テスト終了時の学習記録の保存（日次サマリー累積 + 詳細追加 + streak 更新を 1 トランザクションで）"

    # プロフィール編集（一般ユーザー専用）。名前は必須・パスワードは任意。
    field :update_profile, mutation: Mutations::UpdateProfile,
      description: "プロフィール編集（本人のみ。名前は必須・パスワードは変更時のみ）"

    # 公式単語帳の章の解放（一般ユーザー専用）。完了と次章の解放を同一トランザクションで。
    field :complete_wordbook_progress, mutation: Mutations::CompleteWordbookProgress,
      description: "公式単語帳の章を完了し次章を解放（本人のみ・完了と解放を同一トランザクション）"

    # 動作確認用プレースホルダ（疎通テストで使用）。
    field :noop, Boolean, null: false, description: "プレースホルダ"

    def noop
      true
    end
  end
end
