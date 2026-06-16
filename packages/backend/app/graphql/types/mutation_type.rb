module Types
  class MutationType < Types::BaseObject
    # プレースホルダ。Mutation を実装したら置き換える。
    field :noop, Boolean, null: false, description: "プレースホルダ"

    def noop
      true
    end
  end
end
