# 初期データ投入用。
#   bin/rails db:seed
# 何度実行しても重複しないよう find_or_create_by! で冪等に書く。

# --- 管理者ユーザー（users テーブルに role: admin で作成）---
User.find_or_create_by!(email: "admin@memorise.example") do |admin|
  admin.name = "管理者"
  admin.role = :admin
  admin.password = "password"
end

# --- 公式単語帳（親 → 子（章）→ 単語） ---
parent = Wordbook.official.find_or_create_by!(title: "TOEIC 基礎単語", parent_id: nil) do |wb|
  wb.kind = :official
  wb.label = "toeic"
  wb.level = "basic"
  wb.description = "TOEIC 頻出の基礎単語帳"
end

day1 = parent.children.find_or_create_by!(part: "Day 1") do |wb|
  wb.title = "TOEIC 基礎単語 Day 1"
  wb.kind = :official
  wb.label = "toeic"
  wb.level = "basic"
  wb.order_index = 1
end

[
  { question: "achieve", answer: "達成する" },
  { question: "benefit", answer: "利益・恩恵" },
  { question: "client",  answer: "顧客" },
  { question: "deadline", answer: "締め切り" },
  { question: "estimate", answer: "見積もる" }
].each do |attrs|
  # 公式単語帳の単語は user_id を持たない。
  day1.words.find_or_create_by!(question: attrs[:question]) do |w|
    w.answer = attrs[:answer]
  end
end

puts "Seed 完了: Admin=#{User.admin.count}, Wordbook=#{Wordbook.count}, Word=#{Word.count}"
