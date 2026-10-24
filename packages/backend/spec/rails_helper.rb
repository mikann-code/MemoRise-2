require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"

abort("The Rails environment is running in production mode!") if Rails.env.production?
require "rspec/rails"

# spec/support 配下を読み込む
Dir[Rails.root.join("spec", "support", "**", "*.rb")].sort.each { |f| require f }

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.fixture_paths = [ Rails.root.join("spec/fixtures") ]
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  config.include FactoryBot::Syntax::Methods
  # travel / travel_to（時刻を進める・固定する）
  config.include ActiveSupport::Testing::TimeHelpers

  # request spec の既定ホスト（www.example.com）は Rails 8.1 既定の
  # config.hosts（.localhost / .test）に弾かれ 403 になる。許可ホストに固定する。
  config.before(:each, type: :request) { host! "localhost" }

  # 試行回数制限のカウンタ（Rails.cache = memory_store）を spec 間で持ち越さない。
  config.before { Rails.cache.clear }
end
