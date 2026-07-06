module Resolvers
  # ユーザー一覧（管理者専用）。キーワード検索（名前・メール）・並び替え・ページングに対応する。
  # 一覧本体（nodes）と絞り込み後の総件数（totalCount）を束ねて返す（ページャ表示用）。
  class AdminUsers < BaseResolver
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    type Types::AdminUsersResultType, null: false

    argument :page, Integer, required: false, default_value: 1,
      description: "1 始まりのページ番号"
    argument :per_page, Integer, required: false, default_value: DEFAULT_PER_PAGE,
      description: "1 ページの件数（1〜#{MAX_PER_PAGE} にクランプ）"
    argument :keyword, String, required: false,
      description: "名前・メールの部分一致検索（大小無視・前後空白は無視）"
    argument :sort_by, Types::AdminUserSortFieldType, required: false, default_value: :created_at,
      description: "並び替えの基準（既定：登録日）"
    argument :sort_order, Types::SortOrderType, required: false, default_value: :desc,
      description: "並び順（既定：降順）"

    def resolve(page:, per_page:, sort_by:, sort_order:, keyword: nil)
      require_admin!

      scope = User.all
      if keyword.present?
        pattern = "%#{User.sanitize_sql_like(keyword.strip)}%"
        scope = scope.where("name ILIKE :q OR email ILIKE :q", q: pattern)
      end

      per = per_page.clamp(1, MAX_PER_PAGE)
      current = [ page, 1 ].max

      {
        nodes: scope.order(sort_by => sort_order, id: :asc)
                    .limit(per)
                    .offset((current - 1) * per),
        total_count: scope.count
      }
    end
  end
end
