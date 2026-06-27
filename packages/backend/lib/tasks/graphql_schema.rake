require "graphql/rake_task"

# スキーマを SDL / JSON で出力するタスク（フロントの GraphQL Codegen 用）。
#   bin/rails graphql:schema:dump   # schema.graphql と schema.json を出力
#   bin/rails graphql:schema:idl    # schema.graphql のみ
#   bin/rails graphql:schema:json   # schema.json のみ
GraphQL::RakeTask.new(
  schema_name: "MemoRiseSchema",
  dependencies: [ :environment ],
  idl_outfile: "schema.graphql",
  json_outfile: "schema.json"
)
