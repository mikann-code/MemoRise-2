module Mutations
  # 公式単語帳への単語の CSV 一括登録（管理者専用）。単語は章（子単語帳）にのみ登録できる
  # （教材＝親単語帳は章の入れ物で単語を直接持たない。CreateAdminWord と同じ方針）。
  # 1 行 = "問題,答え"（最初のカンマで 2 分割。答えにカンマを含めたい場合はそのまま後半に残す）。
  # 1 行ずつ単語を作成し、失敗した行は行番号付きエラーとして errors に載せる。
  # 正常な行はそのまま登録し（部分成功）、importedCount で登録件数を返す（部分失敗が分かること）。
  class ImportCsv < BaseMutation
    argument :wordbook_id, ID, required: true, description: "登録先の公式単語帳（章のみ）"
    argument :csv, String, required: true, description: "1 行につき 問題,答え の CSV テキスト"

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :imported_count, Integer, null: false, description: "登録に成功した単語数"
    field :wordbook, Types::WordbookType, null: true

    def resolve(wordbook_id:, csv:)
      return failure(forbidden_errors) unless current_admin

      wordbook = Wordbook.official.kept.find_by(id: wordbook_id)
      return failure(not_found_errors) unless wordbook
      return failure(top_level_wordbook_errors) if wordbook.parent_id.nil?

      row_errors = []
      imported = 0

      # 行番号（n）は CSV 上の行位置に合わせる（空行もカウントに含めてスキップする）。
      # split(-1) で末尾の空要素も保持し、行番号がファイルとずれないようにする。
      csv.split(/\r?\n/, -1).each_with_index do |line, i|
        n = i + 1
        question, answer = line.split(",", 2)
        question = question.to_s.strip
        answer = answer.to_s.strip
        next if question.blank? && answer.blank? # 空行は無視

        word = wordbook.words.build(question: question, answer: answer)
        if word.save
          imported += 1
        else
          row_errors << { field: "csv", message: "#{n}行目: #{word.errors.full_messages.join('、')}" }
        end
      end

      if imported.zero? && row_errors.empty?
        return { success: false, errors: [ { field: "csv", message: "登録できる行がありませんでした" } ],
                 imported_count: 0, wordbook: wordbook }
      end

      { success: row_errors.empty?, errors: row_errors, imported_count: imported, wordbook: wordbook.reload }
    end

    private

    def failure(errors)
      { success: false, errors: errors, imported_count: 0, wordbook: nil }
    end

    def forbidden_errors
      [ { field: "system", message: "権限がありません" } ]
    end

    def not_found_errors
      [ { field: "wordbookId", message: "登録先の公式単語帳が見つかりません" } ]
    end

    def top_level_wordbook_errors
      [ { field: "wordbookId", message: "教材（親単語帳）には単語を登録できません。章を作成して章に登録してください" } ]
    end
  end
end
