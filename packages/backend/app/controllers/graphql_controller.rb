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

  # GraphQL 実行コンテキスト。認証スコープ（current_user / current_admin）に加え、
  # ログイン／ログアウト Mutation がセッションを書き換えられるよう session / controller も載せる
  # （session[:user_id] の設定・reset_session に使う。docs/backend.md 参照）。
  def graphql_context
    {
      current_user: current_user,
      current_admin: current_admin,
      session: session,
      controller: self
    }
  end

  # セッションの user_id からユーザーを解決し、1 リクエストにつき 1 回だけ引いてメモ化する。
  def authenticated_user
    return @authenticated_user if defined?(@authenticated_user)

    @authenticated_user = session[:user_id] ? User.find_by(id: session[:user_id]) : nil
  end

  # users は単一テーブルなので role で一般／管理者のコンテキストを振り分ける。
  def current_user
    authenticated_user&.user? ? authenticated_user : nil
  end

  def current_admin
    authenticated_user&.admin? ? authenticated_user : nil
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
