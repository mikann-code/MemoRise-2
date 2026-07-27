module Mutations
  # 自作単語帳の単語一覧を開いたときに最終閲覧日時（last_studied）を記録する。
  # 単語帳一覧の「最近開いた順」と時刻表示の元。テスト完了時ではなく閲覧時に更新するので、
  # テストを最後まで終えなくても一覧の並びと時刻に反映される。
  # 何度開いても最新時刻へ上書きするだけの冪等な操作（作成物はない）。
  class OpenWordbook < BaseMyWordbookMutation
    argument :id, ID, required: true

    def resolve(id:)
      return failure(unauthorized_errors) unless current_user

      wordbook = find_my_wordbook(id)
      return failure(not_found_errors) unless wordbook

      wordbook.touch_studied!

      { success: true, errors: [], wordbook: wordbook }
    end
  end
end
