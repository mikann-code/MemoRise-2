module Resolvers
  # 自作単語帳 1 件（単語まで）。current_user の personal 以外（他人・公式・論理削除済み）は
  # 存在しても null を返し、ID 総当たりで他人の単語帳を覗けないようにする。
  class MyWordbook < BaseResolver
    type Types::WordbookType, null: true

    argument :id, ID, required: true

    def resolve(id:)
      require_user!

      current_user.wordbooks.personal.kept.find_by(id: id)
    end
  end
end
