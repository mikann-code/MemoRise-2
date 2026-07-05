module Resolvers
  # 復習タグ付きの単語一覧。current_user のタグのみをタグ付けの新しい順に返し、
  # 他人のタグはスコープで構造的に除外する（user_id 引数は受け取らない。docs/backend.md §4 認可方針）。
  class TaggedWords < BaseResolver
    type [ Types::WordType ], null: false

    def resolve
      require_user!

      # 「ユーザー × 単語 × タグ種別」の印の行という意味
      current_user.user_word_tags
                  .where(tag: UserWordTag::REVIEW)
                  .includes(:word)
                  .order(created_at: :desc)
                  .map(&:word)
    end
  end
end
