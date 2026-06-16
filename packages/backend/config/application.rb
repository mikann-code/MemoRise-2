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

    # 日本語・JST
    config.time_zone = "Tokyo"
    config.i18n.default_locale = :ja
    config.i18n.available_locales = [ :ja, :en ]

    config.autoload_lib(ignore: %w[assets tasks])
  end
end
