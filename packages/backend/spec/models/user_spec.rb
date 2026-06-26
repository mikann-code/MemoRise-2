require "rails_helper"

RSpec.describe User, type: :model do
  describe "バリデーション" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to have_secure_password }

    it "email は一意" do
      create(:user, email: "dup@example.com")
      dup = build(:user, email: "dup@example.com")
      expect(dup).to be_invalid
      expect(dup.errors[:email]).to be_present
    end

    it "8 文字未満のパスワードは無効" do
      user = build(:user, password: "short")
      expect(user).to be_invalid
      expect(user.errors[:password]).to be_present
    end
  end

  describe "role enum" do
    it {
      is_expected.to define_enum_for(:role)
        .with_values(user: "user", admin: "admin")
        .backed_by_column_of_type(:string)
    }

    it "既定値は user" do
      expect(User.new.role).to eq("user")
    end
  end

  describe "email の正規化" do
    it "前後の空白除去と小文字化を行う" do
      user = create(:user, email: "  Foo@Example.COM ")
      expect(user.email).to eq("foo@example.com")
    end

    it "大文字小文字違いは重複とみなす" do
      create(:user, email: "dup2@example.com")
      dup = build(:user, email: "DUP2@EXAMPLE.com")
      expect(dup).to be_invalid
      expect(dup.errors[:email]).to be_present
    end
  end

  describe "関連" do
    it { is_expected.to have_many(:wordbooks).dependent(:destroy) }
    it { is_expected.to have_many(:words).dependent(:destroy) }
    it { is_expected.to have_many(:study_records).dependent(:destroy) }
    it { is_expected.to have_many(:user_word_tags).dependent(:destroy) }
    it { is_expected.to have_many(:user_wordbook_progresses).dependent(:destroy) }
  end

  describe "after_create 既定単語帳生成" do
    it "一般ユーザー登録時に「はじめての単語帳」が自動生成される" do
      user = create(:user)
      expect(user.wordbooks.count).to eq(1)
      default = user.wordbooks.first
      expect(default.title).to eq("はじめての単語帳")
      expect(default).to be_personal
    end

    it "管理者には既定単語帳を生成しない" do
      admin = create(:user, :admin)
      expect(admin.wordbooks.count).to eq(0)
    end
  end

  describe "#update_streak!" do
    let(:user) { create(:user) }
    let(:today) { Time.zone.today }

    it "初回（last_study_date が nil）は 1 になる" do
      user.update_streak!
      expect(user.reload.streak).to eq(1)
      expect(user.last_study_date).to eq(today)
    end

    it "昨日学習済みなら streak を +1 する" do
      user.update_columns(streak: 3, last_study_date: today - 1)
      user.update_streak!
      expect(user.reload.streak).to eq(4)
      expect(user.last_study_date).to eq(today)
    end

    it "間隔が空いていたら streak を 1 にリセットする" do
      user.update_columns(streak: 5, last_study_date: today - 3)
      user.update_streak!
      expect(user.reload.streak).to eq(1)
    end

    it "今日すでに更新済みなら何もしない（冪等）" do
      user.update_columns(streak: 2, last_study_date: today)
      expect { user.update_streak! }.not_to(change { user.reload.streak })
    end
  end

  describe "#refresh_streak!" do
    let(:user) { create(:user) }
    let(:today) { Time.zone.today }

    it "最終学習が今日なら維持する" do
      user.update_columns(streak: 5, last_study_date: today)
      expect { user.refresh_streak! }.not_to(change { user.reload.streak })
    end

    it "最終学習が昨日なら維持する（当日学習で繋がる猶予）" do
      user.update_columns(streak: 5, last_study_date: today - 1)
      expect { user.refresh_streak! }.not_to(change { user.reload.streak })
    end

    it "最終学習が一昨日以前なら 0 にリセットする" do
      user.update_columns(streak: 5, last_study_date: today - 2)
      user.refresh_streak!
      expect(user.reload.streak).to eq(0)
    end

    it "リセットしても last_study_date は書き換えない" do
      user.update_columns(streak: 5, last_study_date: today - 2)
      user.refresh_streak!
      expect(user.reload.last_study_date).to eq(today - 2)
    end

    it "既に 0 なら書き込まない（冪等）" do
      user.update_columns(streak: 0, last_study_date: today - 10)
      expect { user.refresh_streak! }.not_to(change { user.reload.updated_at })
    end
  end
end
