# 開発用：既定の管理者ユーザーを作成するタスク。
# 管理者は signUp / 画面から作成できない設計（role はサーバー側固定）のため、
# /admin-login の動作確認用に「打ったら作られる」入口をここに用意する。
#
#   bin/rails admin:create
#
# development 環境専用。固定の dev 管理者を冪等に作成する（既存ならそのまま）。
namespace :admin do
  desc "開発環境に既定の管理者ユーザーを作成する（dev 専用・冪等）"
  task create: :environment do
    unless Rails.env.development?
      abort "admin:create は development 環境専用です（現在: #{Rails.env}）"
    end

    email = "admin@example.com"
    admin = User.find_or_initialize_by(email: email)

    if admin.persisted?
      puts "管理者は既に存在します: #{admin.email}（role: #{admin.role}）"
    else
      admin.assign_attributes(name: "管理者", password: "password", role: :admin)
      admin.save!
      puts "管理者を作成しました: #{admin.email} / password（role: #{admin.role}）"
    end
  end
end
