# 開発用：動作確認用のデモ公式単語帳を作成するタスク。
# 公式単語帳は現状 UI から作成できないため、一覧 → 親 → 章 → 単語の導線を
# ローカルで確認したいときに「打ったら作られる」入口をここに用意する。
#
#   bin/rails demo:wordbooks
#
# development 環境専用。何度実行しても重複しないよう find_or_create_by! で冪等に書く。
# 本番に入れたくないデータなので db/seeds.rb（全環境で流れる）ではなくこの rake に置く。
namespace :demo do
  desc "開発環境に動作確認用のデモ公式単語帳（親→章→単語）を作成する（dev 専用・冪等）"
  task wordbooks: :environment do
    unless Rails.env.development?
      abort "demo:wordbooks は development 環境専用です（現在: #{Rails.env}）"
    end

    # 親（教材）→ 子（章）→ 単語の3階層をまとめて定義する。
    demo = [
      {
        title: "【DEMO】英検3級 単語",
        label: "eiken",
        level: "basic",
        description: "動作確認用のデモ単語帳（英検3級）",
        chapters: [
          {
            words: [
              { question: "improve",  answer: "改善する" },
              { question: "environment", answer: "環境" },
              { question: "decide",   answer: "決める" },
              { question: "several",  answer: "いくつかの" }
            ]
          },
          {
            words: [
              { question: "increase", answer: "増える・増やす" },
              { question: "reason",   answer: "理由" },
              { question: "although", answer: "〜だけれども" }
            ]
          }
        ]
      },
      {
        title: "【DEMO】中学英語 基礎",
        label: "junior_high",
        level: "basic",
        description: "動作確認用のデモ単語帳（中学基礎）",
        chapters: [
          {
            words: [
              { question: "apple",  answer: "りんご" },
              { question: "school", answer: "学校" },
              { question: "friend", answer: "友だち" }
            ]
          }
        ]
      }
    ]

    demo.each do |book|
      parent = Wordbook.official.find_or_create_by!(title: book[:title], parent_id: nil) do |wb|
        wb.kind = :official
        wb.label = book[:label]
        wb.level = book[:level]
        wb.description = book[:description]
      end

      book[:chapters].each_with_index do |ch, i|
        # 章番号（第○章）は持たず、並び順（order_index）だけを振る。
        # 表示上の番号はフロントが order_index 順の並び位置から導出する。
        chapter = parent.children.find_or_create_by!(order_index: i + 1) do |wb|
          wb.title = "#{book[:title]} 第#{i + 1}章"
          wb.kind = :official
          wb.label = book[:label]
          wb.level = book[:level]
        end

        ch[:words].each do |attrs|
          # 公式単語帳の単語は user_id を持たない。
          chapter.words.find_or_create_by!(question: attrs[:question]) do |w|
            w.answer = attrs[:answer]
          end
        end
      end
    end

    puts "デモ単語帳を作成しました: 公式 Wordbook=#{Wordbook.official.count}, Word=#{Word.count}"
  end
end
