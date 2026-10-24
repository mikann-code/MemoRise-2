module Mutations
  # Mutation の基底クラス。引数をフラットに受け取る非 Relay 形式
  # （GraphQL::Schema::Mutation）。base 系のフィールド／引数クラスを差し込む。
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    # ログイン失敗の上限（login / adminLogin 共通。同じメールアドレスで 15 分に 10 回まで）。
    LOGIN_FAILURE_LIMIT = 10
    LOGIN_FAILURE_WINDOW = 15.minutes

    private

    def current_user
      context[:current_user]
    end

    def current_admin
      context[:current_admin]
    end

    # ログイン状態を保持・破棄するためのセッション（DB セッションストア）。
    def session
      context[:session]
    end

    # 一般ユーザー必須の Mutation で使う。未認証なら UNAUTHORIZED。
    def require_user!
      current_user || raise(Errors::Unauthorized.new)
    end

    # セッション ID を作り直してからログイン状態にする（セッション固定攻撃への備え）。
    # reset_session 後も session は同じオブジェクトが新しい ID で使える。
    def sign_in(user)
      context[:controller].reset_session
      session[:user_id] = user.id
    end

    # 試行回数の制限。Rails.cache に固定ウィンドウのカウンタを持つ（ActionController の rate_limit と同じ方式）。
    # GraphQL は単一エンドポイントなので、コントローラーではなく Mutation 単位で数える。
    def attempts_exceeded?(key, limit)
      Rails.cache.read(key).to_i >= limit
    end

    def record_attempt(key, within)
      Rails.cache.increment(key, 1, expires_in: within)
    end

    def reset_attempts(key)
      Rails.cache.delete(key)
    end

    # ログイン失敗のカウンタはメールアドレス単位（存在しないメールも同じく数え、存在を教えない）。
    def login_failures_key(email)
      "login_failures:#{email}"
    end

    def too_many_attempts_errors
      [ { field: "system", message: "試行回数が多すぎます。しばらく時間をおいてから再度お試しください" } ]
    end
  end
end
