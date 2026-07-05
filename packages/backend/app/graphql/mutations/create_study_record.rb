module Mutations
  # テスト終了時の学習記録の保存。「日次サマリー（study_records）の増分更新 +
  # 詳細レコード（study_details）の追加 + streak 更新」を 1 トランザクションで行い、
  # 「履歴は残るが進捗が更新されない」等の不整合を防ぐ（docs/backend.md §3）。
  # 学習日はクライアントから受け取らずサーバー日付（JST の今日）で記録する。
  # 同一テストの二重送信防止はフロント側（hasPostedRef）が担う（docs/frontend.md §5）。
  class CreateStudyRecord < BaseMutation
    argument :kind, Types::StudyRecordKindType, required: true,
      description: "記録の種類（WORDBOOK = 単語帳のテスト / REVIEW = 復習専用テスト）"
    argument :total_count, Integer, required: true, description: "出題数"
    argument :correct_count, Integer, required: true, description: "正答数"
    argument :wordbook_id, ID, required: false,
      description: "学習した単語帳（WORDBOOK では必須・REVIEW では指定不可）"

    field :success, Boolean, null: false
    field :errors, [ Types::ValidationErrorType ], null: false
    field :study_record, Types::StudyRecordType, null: true

    def resolve(kind:, total_count:, correct_count:, wordbook_id: nil)
      return failure(unauthorized_errors) unless current_user

      # 種類と wordbookId の組み合わせを先に検証する（消去法で復習扱いにしない）。
      wordbook = nil
      case kind
      when "review"
        return failure(review_with_wordbook_errors) if wordbook_id
      when "wordbook"
        return failure(wordbook_required_errors) unless wordbook_id

        wordbook = find_studied_wordbook(wordbook_id)
        return failure(wordbook_not_found_errors) unless wordbook
      end

      # 1日1レコードにまとめる
      record = current_user.study_records.find_or_initialize_by(study_date: Time.zone.today)
      record.study_count = record.study_count.to_i + total_count
      detail = record.study_details.build(
        title: detail_title(kind, wordbook),
        rate: rate_of(total_count, correct_count),
        total_count: total_count,
        correct_count: correct_count,
        chapter_wordbook: wordbook
      )
      return failure(validation_errors(detail)) unless detail.valid?

      ActiveRecord::Base.transaction do
        record.save! # 関連で組み立てた detail も同時に保存される
        current_user.update_streak!
      end

      { success: true, errors: [], study_record: record }
    end

    private

    def failure(errors)
      { success: false, errors: errors, study_record: nil }
    end

    # 未認証。存在確認より先に必ず判定する。
    def unauthorized_errors
      [ { field: "system", message: "認証が必要です" } ]
    end

    # 対象が見つからない（他人の単語帳・論理削除済みを含む）。
    def wordbook_not_found_errors
      [ { field: "wordbookId", message: "対象の単語帳が見つかりません" } ]
    end

    # 組み合わせ不正：復習テスト（REVIEW）に単語帳は指定できない。
    def review_with_wordbook_errors
      [ { field: "wordbookId", message: "復習テストでは指定できません" } ]
    end

    # 組み合わせ不正：単語帳のテスト（WORDBOOK）には単語帳の指定が必要。
    def wordbook_required_errors
      [ { field: "wordbookId", message: "単語帳を指定してください" } ]
    end

    # ActiveRecord のバリデーションエラーを field 単位の表示用エラーへ変換する。
    def validation_errors(record)
      record.errors.map { |e| { field: e.attribute.to_s.camelize(:lower), message: e.full_message } }
    end

    # 記録対象にできる単語帳：本人の自作 or 公式（章を含む）。論理削除済みは除く。
    def find_studied_wordbook(id)
      wordbook = Wordbook.kept.find_by(id: id)
      return nil unless wordbook
      return wordbook if wordbook.official?

      (wordbook.personal? && wordbook.user_id == current_user.id) ? wordbook : nil
    end

    # 学習記録に表示する名前。復習専用テストは固定名、
    # 公式の章は「親タイトル + part」（v1 踏襲）、自作は単語帳名。
    def detail_title(kind, wordbook)
      return "復習テスト" if kind == "review"
      return "#{wordbook.parent.title} #{wordbook.part}" if wordbook.parent

      wordbook.title
    end

    # 正答率（%・四捨五入）。クライアント値を信用せずサーバーで計算する。
    def rate_of(total_count, correct_count)
      return 0 unless total_count.positive?

      (correct_count * 100.0 / total_count).round
    end
  end
end
