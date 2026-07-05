require "rails_helper"

RSpec.describe Mutations::UpdateProfile do
  let(:mutation) do
    <<~GQL
      mutation UpdateProfile($name: String!, $password: String, $passwordConfirmation: String) {
        updateProfile(name: $name, password: $password, passwordConfirmation: $passwordConfirmation) {
          success
          errors { field message }
          user { id name email }
        }
      }
    GQL
  end

  let(:user) { create(:user, name: "旧名前", password: "password") }

  def execute_update(variables, context: { current_user: user })
    execute_graphql(mutation, variables: variables, context: context)
      .dig("data", "updateProfile")
  end

  describe "正常系" do
    it "名前を更新する" do
      data = execute_update({ name: "新名前" })

      expect(data["success"]).to be(true)
      expect(data["errors"]).to eq([])
      expect(data.dig("user", "name")).to eq("新名前")
      expect(user.reload.name).to eq("新名前")
    end

    it "パスワードも変更できる（確認一致・8 文字以上）" do
      data = execute_update(
        { name: "新名前", password: "newpassword", passwordConfirmation: "newpassword" }
      )

      expect(data["success"]).to be(true)
      expect(user.reload.authenticate("newpassword")).to be_truthy
    end

    it "パスワード未指定なら名前だけ更新し、パスワードは変わらない" do
      execute_update({ name: "新名前" })

      expect(user.reload.authenticate("password")).to be_truthy
    end
  end

  describe "異常系" do
    it "名前が空ならバリデーションエラーで保存しない" do
      data = execute_update({ name: "" })

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("name")
      expect(user.reload.name).to eq("旧名前")
    end

    it "パスワード確認が一致しないとエラーで保存しない" do
      data = execute_update(
        { name: "新名前", password: "newpassword", passwordConfirmation: "different" }
      )

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("passwordConfirmation")
      expect(user.reload.name).to eq("旧名前")
      expect(user.authenticate("password")).to be_truthy
    end

    it "パスワードが 8 文字未満だとエラーで保存しない" do
      data = execute_update(
        { name: "新名前", password: "short", passwordConfirmation: "short" }
      )

      expect(data["success"]).to be(false)
      expect(data["errors"].map { |e| e["field"] }).to include("password")
      expect(user.reload.name).to eq("旧名前")
    end
  end

  describe "認可" do
    it "未認証は更新できない（system エラー）" do
      data = execute_update({ name: "新名前" }, context: {})

      expect(data["success"]).to be(false)
      expect(data.dig("errors", 0, "field")).to eq("system")
    end
  end
end
