# frozen_string_literal: true

# GraphQL スキーマを HTTP を介さず直接実行するヘルパー。
# context に current_user / session を明示注入して resolver 単体の挙動を検証する用途。
# （Cookie・セッション破棄の往復まで見たい認証ライフサイクル系は request spec 側で検証する。）
module GraphqlHelpers
  def execute_graphql(query, variables: {}, context: {})
    MemoRiseSchema.execute(query, variables: variables, context: context).to_h
  end
end

RSpec.configure do |config|
  config.include GraphqlHelpers
end
