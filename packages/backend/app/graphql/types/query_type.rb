module Types
  class QueryType < Types::BaseObject
    # ログイン中の一般ユーザー。未認証なら null を返す（フロントはこれで未認証を判定する）。
    field :me, Types::UserType, null: true, description: "ログイン中の一般ユーザー（未認証なら null）"

    # ログイン中の管理者。管理者でなければ（role 不一致・未認証とも）null を返す。
    # フロントの管理者ガードはこれで判定し、null なら /admin-login へリダイレクトする。
    field :admin_me, Types::UserType, null: true, description: "ログイン中の管理者（管理者でなければ null）"

    # 公式単語帳の閲覧（読み取り専用・要ログイン）。認可は各 Resolver の冒頭でガードする。
    field :public_wordbooks, resolver: Resolvers::PublicWordbooks,
      description: "公式単語帳の親一覧（読み取り専用・要ログイン）"
    field :public_wordbook, resolver: Resolvers::PublicWordbook,
      description: "公式単語帳の親 1 件（子＝章・単語まで。読み取り専用・要ログイン）"

    # 自作単語帳の閲覧（本人のみ・要ログイン）。current_user スコープで他人・公式を除外する。
    field :my_wordbooks, resolver: Resolvers::MyWordbooks,
      description: "自作単語帳の一覧（本人の personal のみ・論理削除を除く・要ログイン）"
    field :my_wordbook, resolver: Resolvers::MyWordbook,
      description: "自作単語帳 1 件（単語まで。本人以外・公式・論理削除済みは null）"

    # 今日の一問（公式単語からランダム 1 件・要ログイン）。公式単語が無ければ null。
    field :today_word, resolver: Resolvers::TodayWord,
      description: "今日の一問（公式単語からランダム 1 件・要ログイン。公式単語が無ければ null）"

    # 公式単語帳の章の解放状態（本人のみ・要ログイン）。先頭章は取得時に遅延作成する。
    field :wordbook_progresses, resolver: Resolvers::WordbookProgresses,
      description: "公式単語帳（親）の章ごとの解放状態（本人のみ・先頭章は遅延作成・要ログイン）"

    # 復習タグの閲覧（本人のみ・要ログイン）。current_user スコープで他人のタグを除外する。
    field :tagged_words, resolver: Resolvers::TaggedWords,
      description: "復習タグ付きの単語一覧（本人のみ・タグ付けの新しい順・要ログイン）"

    # 学習記録の閲覧（本人のみ・要ログイン）。current_user スコープで他人の記録を除外する。
    field :study_records, resolver: Resolvers::StudyRecords,
      description: "学習記録の月別一覧（カレンダー用・study_details 込み・要ログイン）"
    field :study_records_week, resolver: Resolvers::StudyRecordsWeek,
      description: "学習記録の週別一覧（startDate から 7 日分・要ログイン）"
    field :study_records_recent, resolver: Resolvers::StudyRecordsRecent,
      description: "直近の学習記録一覧（新しい日付順・最大 30 件・要ログイン）"

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
