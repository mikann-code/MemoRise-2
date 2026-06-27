# GraphQL のドメインエラー。`extensions.code` を載せ、フロント（Apollo）が
# コードで分岐できるようにする（未認証・権限なし等）。
module Errors
  class BaseError < GraphQL::ExecutionError
    def initialize(message, code:)
      super(message, extensions: { "code" => code })
    end
  end

  # 一般ユーザーとしての認証が必要なとき。
  class Unauthorized < BaseError
    def initialize(message = "認証が必要です")
      super(message, code: "UNAUTHORIZED")
    end
  end

  # 認証はされているが権限が足りない（管理者専用など）とき。
  class Forbidden < BaseError
    def initialize(message = "権限がありません")
      super(message, code: "FORBIDDEN")
    end
  end
end
