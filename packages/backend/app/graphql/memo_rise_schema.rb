class MemoRiseSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  # N+1 を避けるための DataLoader（docs/backend.md 参照）
  use GraphQL::Dataloader

  # 例外を GraphQL エラーへ変換する。extensions.code でフロントが分岐できる。
  rescue_from(ActiveRecord::RecordNotFound) do |_err, _obj, _args, _ctx, field|
    raise GraphQL::ExecutionError.new(
      "#{field.type.unwrap.graphql_name} not found",
      extensions: { "code" => "NOT_FOUND" }
    )
  end

  rescue_from(ActiveRecord::RecordInvalid) do |err, _obj, _args, _ctx, _field|
    raise GraphQL::ExecutionError.new(
      err.record.errors.full_messages.join(", "),
      extensions: { "code" => "UNPROCESSABLE_ENTITY" }
    )
  end
end
