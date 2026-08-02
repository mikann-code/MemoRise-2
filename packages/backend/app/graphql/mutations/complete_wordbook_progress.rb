module Mutations
  # 公式単語帳の章を完了し、次の章を解放する（本人のみ）。
  # 現在の章を completed: true にし、order_index 昇順で次の章の進捗レコードを
  # find_or_create_by! で作る。この 2 つを同一トランザクションで行い、
  # 「完了したのに次が解放されない／次が解放されたのに完了扱いにならない」不整合を防ぐ。
  # 二重送信はフロント（completedRef）が抑えるが、レコード方式なので冪等でもある。
  # 下書き（draft）の教材の章は対象外（章は親の status を伝播で持つので章側で判定できる）。
  class CompleteWordbookProgress < BaseMutation
    argument :wordbook_id, ID, required: true, description: "完了した章（子単語帳）の ID"

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :progresses, [ Types::WordbookProgressType ], null: false,
      description: "更新後の同教材内の解放状態（章 = 子単語帳ごと）"

    def resolve(wordbook_id:)
      return failure(unauthorized_errors) unless current_user

      chapter = Wordbook.official.kept.published.where.not(parent_id: nil).find_by(id: wordbook_id)
      return failure(not_found_errors) unless chapter

      ActiveRecord::Base.transaction do
        progress = current_user.user_wordbook_progresses.find_or_create_by!(wordbook_id: chapter.id)
        progress.update!(completed: true)

        next_chapter = next_chapter_of(chapter)
        current_user.user_wordbook_progresses.find_or_create_by!(wordbook_id: next_chapter.id) if next_chapter
      end

      { success: true, errors: [], progresses: progresses_of(chapter.parent_id) }
    end

    private

    def failure(errors)
      { success: false, errors: errors, progresses: [] }
    end

    def unauthorized_errors
      [ { field: "system", message: "認証が必要です" } ]
    end

    def not_found_errors
      [ { field: "wordbookId", message: "対象の章が見つかりません" } ]
    end

    # order_index 昇順（未設定は末尾）で、現在の章の次に来る章を返す。無ければ nil。
    def next_chapter_of(chapter)
      siblings = chapter.parent.children.kept.order(:order_index, :id).to_a
      current_index = siblings.find_index { |c| c.id == chapter.id }
      current_index ? siblings[current_index + 1] : nil
    end

    def progresses_of(parent_id)
      current_user.user_wordbook_progresses
                  .joins(:wordbook)
                  .where(wordbooks: { parent_id: parent_id })
    end
  end
end
