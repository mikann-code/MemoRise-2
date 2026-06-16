Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.log_tags = [ :request_id ]
  config.logger = ActiveSupport::TaggedLogging.logger(STDOUT)

  config.active_record.dump_schema_after_migration = false
  config.i18n.fallbacks = true

  # 本番は HTTPS 前提
  config.force_ssl = ENV["DISABLE_FORCE_SSL"].blank?
end
