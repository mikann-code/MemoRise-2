class ApplicationController < ActionController::API
  # API モードでも DB セッション（session / cookies）を扱えるようにする。
  include ActionController::Cookies
end
