module Resolvers
  # 公式単語帳（親）の章ごとの解放状態を返す。解放は進捗レコードの存在で表現する。
  # 一覧取得時に先頭の章の進捗を遅延作成（lazy initialization）することで、
  # 初回でも先頭の章だけは解放済みになる（別途の初期化 API を持たない）。
  # 認可は current_user スコープ（他人の進捗は混ざらない）。親が公式・存在でなければ空配列を返す。
  class WordbookProgresses < BaseResolver
    type [ Types::WordbookProgressType ], null: false

    argument :wordbook_id, ID, required: true,
      description: "公式単語帳の親 ID（この教材の章の解放状態を返す）"

    def resolve(wordbook_id:)
      require_user!

      parent = Wordbook.official.kept.where(parent_id: nil).find_by(id: wordbook_id)
      return [] unless parent

      # 先頭の章の進捗を遅延作成する（冪等）。以降の章は完了時に解放される。
      first_child = parent.children.kept.order(:order_index, :id).first
      current_user.user_wordbook_progresses.find_or_create_by!(wordbook_id: first_child.id) if first_child

      current_user.user_wordbook_progresses
                  .joins(:wordbook)
                  .where(wordbooks: { parent_id: parent.id })
    end
  end
end
