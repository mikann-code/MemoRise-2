module Resolvers
  # 今日の一問。公式単語帳の単語からランダムに 1 件返す軽実装（docs/backend.md）。
  # 「単語と出会う回数を増やす」ことが目的で、履歴管理や重複回避はしない。
  # 論理削除済み・下書きの公式単語帳は除外し、公式単語が 0 件なら null を返す
  # （フロントは内蔵の fallbackWords に切り替えて初回ロードの空白を防ぐ）。
  # 単語は章にぶら下がるが、章は親（教材）の status を伝播で持つのでここで直接絞れる。
  class TodayWord < BaseResolver
    type Types::WordType, null: true

    def resolve
      require_user!

      Word.joins(:wordbook)
          .merge(Wordbook.official.kept.published)
          .order(Arel.sql("RANDOM()"))
          .first
    end
  end
end
