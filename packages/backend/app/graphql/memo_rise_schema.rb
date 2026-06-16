class MemoRiseSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  # N+1 を避けるための DataLoader（docs/backend.md 参照）
  use GraphQL::Dataloader

  # 例外時のハンドリング
  rescue_from(ActiveRecord::RecordNotFound) do |_err, _obj, _args, _ctx, field|
    raise GraphQL::ExecutionError, "#{field.type.unwrap.graphql_name} not found"
  end
end
