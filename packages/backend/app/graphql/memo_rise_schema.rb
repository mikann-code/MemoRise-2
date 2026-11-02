class MemoRiseSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  # N+1 を避けるための DataLoader（docs/backend.md 参照）
  use GraphQL::Dataloader

  # クエリの深さ・複雑度の上限。フロントの既存オペレーションは最大で深さ 4・複雑度 19 なので余裕を持たせた値。
  # WordbookType#children は自分と同じ型を返すため、深さの上限で入れ子を打ち切る。
  # イントロスペクション（開発時の GraphiQL / schema dump）は数えない（標準のクエリは深さ 13 を超える）。
  max_depth 10, count_introspection_fields: false
  max_complexity 200, count_introspection_fields: false

  # 本番ではスキーマを外から一覧できないようにする。フロントの codegen はコミット済みの
  # schema.graphql を読み、GraphiQL は development 限定なので影響しない。
  disable_introspection_entry_points if Rails.env.production?

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
