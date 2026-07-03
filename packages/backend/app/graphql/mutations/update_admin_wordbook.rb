module Mutations
  # 公式単語帳の更新（管理者専用）。親（教材）・子（章）どちらも対象。
  # 渡された引数のみを部分更新する（未指定の項目は変更しない）。
  # 親の label / level を変更した場合は子（章）へ伝播する（issue #14: 親更新→子伝播）。
  # 伝播は論理削除済みの章にも行い、復元時に親とずれないようにする。
  class UpdateAdminWordbook < BaseAdminWordbookMutation
    argument :id, ID, required: true
    argument :title, String, required: false
    argument :description, String, required: false
    argument :label, String, required: false, description: "親の変更は章へ伝播"
    argument :level, String, required: false, description: "親の変更は章へ伝播"
    argument :part, String, required: false, description: "章番号"
    argument :order_index, Integer, required: false, description: "並び順"

    def resolve(id:, **attrs)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.find_by(id: id)
      return failure(not_found_errors) unless wordbook

      wordbook.assign_attributes(attrs)
      return failure(validation_errors(wordbook)) unless wordbook.valid?

      # save! 前に変更分を取り出す（保存後は changes が空になるため）。
      propagated = wordbook.changes.slice("label", "level").transform_values(&:last)

      ActiveRecord::Base.transaction do
        wordbook.save!

        if wordbook.parent_id.nil? && propagated.any?
          wordbook.children.update_all(propagated.merge(updated_at: Time.current))
        end
      end

      { success: true, errors: [], wordbook: wordbook }
    rescue ActiveRecord::RecordNotUnique
      failure(duplicate_errors)
    end
  end
end
