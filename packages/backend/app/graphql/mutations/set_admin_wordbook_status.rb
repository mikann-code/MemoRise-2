module Mutations
  # 公式単語帳（教材）の公開状態の切り替え（管理者専用）。
  # 対象は教材（トップレベル = parent_id: nil）のみ。章（子）は自身では切り替えられず、
  # 親の値を伝播で受け取る（章ごとの段階公開はしない。設計理由は Wordbook#status のコメント）。
  # 伝播は論理削除済みの章にも行い、復元時に親とずれないようにする
  # （updateAdminWordbook の label / level 伝播と同じ方針）。
  # 更新の入口をここに一本化するため、updateAdminWordbook は status を受け付けない。
  class SetAdminWordbookStatus < BaseAdminWordbookMutation
    argument :id, ID, required: true, description: "教材（トップレベルの公式単語帳）の ID"
    argument :status, Types::WordbookStatusType, required: true

    def resolve(id:, status:)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.where(parent_id: nil).find_by(id: id)
      return failure(not_found_errors) unless wordbook

      ActiveRecord::Base.transaction do
        wordbook.update!(status: status)
        wordbook.children.update_all(status: status, updated_at: Time.current)
      end

      { success: true, errors: [], wordbook: wordbook }
    end

    private

    # 対象が見つからない（章・自作・論理削除済みを含む）。教材以外は存在を教えない。
    def not_found_errors
      [ { field: "id", message: "対象の教材が見つかりません" } ]
    end
  end
end
