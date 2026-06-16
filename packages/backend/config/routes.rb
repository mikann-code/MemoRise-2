Rails.application.routes.draw do
  # ヘルスチェック（Kamal / LB 監視用）
  get "up" => "rails/health#show", as: :rails_health_check

  # GraphQL 単一エンドポイント
  post "/graphql", to: "graphql#execute"
end
