module Mutations
  # 公式単語帳の作成（管理者専用）。
  # parent_id なしで親（教材）、ありで子（章）を作成する。階層は親→章の 2 段まで
  # （章の下に章は作れない）ため、親に指定できるのはトップレベルの公式単語帳のみ。
  # 章の label / level を省略した場合は親の値を引き継ぐ（教材単位で揃える運用のため）。
  # 単語は章にのみ登録できる設計（createAdminWord / importCsv）のため、親の作成時は
  # 既定の章「第1章」を同一トランザクションで 1 つ自動作成し、章ゼロの教材を作らない。
  # 公開状態は既定で published（そのまま一般ユーザーに見える）。準備中の教材は status: DRAFT で
  # 作り、整ってから setAdminWordbookStatus で公開する。
  class CreateAdminWordbook < BaseAdminWordbookMutation
    argument :title, String, required: true
    argument :description, String, required: false
    argument :label, String, required: false, description: "省略時、章は親の label を引き継ぐ"
    argument :level, String, required: false, description: "省略時、章は親の level を引き継ぐ"
    argument :parent_id, ID, required: false, description: "指定すると章（子）として作成"
    argument :order_index, Integer, required: false, description: "並び順"
    argument :status, Types::WordbookStatusType, required: false,
      description: "省略時は PUBLISHED。DRAFT を指定すると下書きとして作成する（章は親の値を引き継ぐ）"

    def resolve(title:, description: nil, label: nil, level: nil, parent_id: nil, order_index: nil, status: nil)
      return failure(forbidden_errors) unless current_admin

      parent = nil
      if parent_id.present?
        parent = Wordbook.official.kept.where(parent_id: nil).find_by(id: parent_id)
        return failure(parent_not_found_errors) unless parent
      end

      wordbook = Wordbook.new(
        title: title,
        description: description,
        label: label || parent&.label,
        level: level || parent&.level,
        order_index: order_index || (parent && next_chapter_order(parent)),
        parent: parent,
        kind: :official,
        # 章は親の公開状態に追従する。教材は指定があればそれ、無ければ既定の published。
        status: parent&.status || status || :published,
        user: nil
      )

      return failure(validation_errors(wordbook)) unless wordbook.valid?

      Wordbook.transaction do
        wordbook.save!
        create_default_chapter!(wordbook) if parent.nil?
      end

      { success: true, errors: [], wordbook: wordbook }
    rescue ActiveRecord::RecordNotUnique
      failure(duplicate_errors)
    end

    private

    # 章（子）の並び順を末尾へ自動採番する。管理者に数値を意識させないため、
    # 追加した順に第1章→第2章…と並ぶよう「同じ親内の最大 order_index + 1」を割り当てる。
    # 論理削除済みの章は order_index が NULL（席を明け渡し済み）なので maximum の対象外。
    # 並び替えは progress（章の解放順）と直結するため、必要になったら別途 UI で扱う。
    def next_chapter_order(parent)
      parent.children.maximum(:order_index).to_i + 1
    end

    # 教材に必ず 1 つは章がある状態を作る既定の章。label / level / status は親を引き継ぐ。
    # タイトル等は作成後に updateAdminWordbook で変更できる。
    def create_default_chapter!(parent)
      parent.children.create!(
        title: "第1章",
        order_index: 1,
        label: parent.label,
        level: parent.level,
        kind: :official,
        status: parent.status,
        user: nil
      )
    end

    # 親が見つからない（公式のトップレベル以外＝自作・章・削除済みを含む）。
    def parent_not_found_errors
      [ { field: "parentId", message: "親の公式単語帳が見つかりません" } ]
    end
  end
end
