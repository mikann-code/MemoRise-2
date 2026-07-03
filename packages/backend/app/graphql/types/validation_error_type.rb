module Types
  # ユーザーに表示する入力／操作エラー。ミューテーションの {success, errors} 方式で使う。
  # field はエラーの対象（入力引数名。入力に紐づかない全体エラーは "system"）、
  # message は表示用の文言。GraphQL の top-level errors（例外）ではなく通常レスポンスで返し、
  # フロントがフィールド単位で出し分けられるようにする。
  class ValidationErrorType < Types::BaseObject
    field :field, String, null: false, description: "エラーの対象（入力引数名 / 全体は system）"
    field :message, String, null: false, description: "表示用メッセージ"
  end
end
