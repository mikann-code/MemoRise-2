allowed_origins = [ ENV["FRONTEND_URL"], ENV["LOCAL_FRONTEND_URL"] ].compact
allowed_origins = [ "http://localhost:3200" ] if allowed_origins.empty?

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)
    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
