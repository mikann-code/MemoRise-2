require_relative "boot"

require "rails"
# API モードに必要なフレームワークのみを読み込む（最小構成）
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "active_job/railtie"
# require "rails/test_unit/railtie"

# Gemfile に列挙された gem を require する
Bundler.require(*Rails.groups)

module MemoRise
  class Application < Rails::Application
    config.load_defaults 8.1

    # API 専用モード（ビュー・Cookies・Flash 等を持たない）
    config.api_only = true

    # API モードはセッションが既定で無効なので、DB セッションストアを手動で有効化する。
    # Cookie には session_id のみを載せ、user_id 等は sessions テーブル側に保持する
    # （docs/tech-stack.md「セッション=activerecord-session_store（DB 管理）」）。
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::ActiveRecordStore,
      key: "_memorise_session",
      same_site: :lax,
      secure: Rails.env.production?,
      domain: ENV["SESSION_COOKIE_DOMAIN"]

    # 日本語・JST
    config.time_zone = "Tokyo"
    config.i18n.default_locale = :ja
    config.i18n.available_locales = [ :ja, :en ]

    config.autoload_lib(ignore: %w[assets tasks])
  end
end
