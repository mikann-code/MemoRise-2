class GraphqlController < ApplicationController
  def execute
    result = MemoRiseSchema.execute(
      params[:query],
      variables: prepare_variables(params[:variables]),
      context: graphql_context,
      operation_name: params[:operationName]
    )
    render json: result
  rescue StandardError => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  # GraphQL 実行コンテキスト。認証スコープ（current_user / current_admin）を載せ、
  # 各 Resolver の冒頭でガードに使う（docs/backend.md 参照）。
  def graphql_context
    {
      current_user: current_user,
      current_admin: current_admin
    }
  end

  # 認証済みユーザーを 1 リクエストにつき 1 回だけ解決してメモ化する。
  def authenticated_user
    return @authenticated_user if defined?(@authenticated_user)

    @authenticated_user = resolve_user_from_token
  end

  # users は単一テーブルなので role で一般／管理者のコンテキストを振り分ける。
  def current_user
    authenticated_user&.user? ? authenticated_user : nil
  end

  def current_admin
    authenticated_user&.admin? ? authenticated_user : nil
  end

  # Authorization: Bearer <token> からトークン文字列を取り出す。
  def bearer_token
    header = request.headers["Authorization"]
    header.to_s.split(" ").last if header&.start_with?("Bearer ")
  end

  # トークンからユーザーを解決する。
  # NOTE: JWT の発行・検証（JsonWebToken）と Cookie 連携は認証 Issue（#5 / #6）で実装する。
  #       本 Issue（GraphQL 基盤）では context へ載せる仕組みのみを用意し、現状は未認証扱い。
  def resolve_user_from_token
    return nil if bearer_token.blank?

    nil
  end

  def prepare_variables(variables_param)
    case variables_param
    when String
      variables_param.present? ? JSON.parse(variables_param) || {} : {}
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")
    render json: {
      errors: [ { message: e.message, backtrace: e.backtrace } ],
      data: {}
    }, status: 500
  end
end
