packages/frontend ディレクトリで `yarn build` を実行して、エラーと警告を確認してください。

## コマンド

```bash
# .next を削除 → 依存関係インストール → ビルド
rm -rf packages/frontend/.next && cd packages/frontend && yarn install && yarn build 2>&1
```

## 結果の報告手順

### 1. ビルド成否を最初に伝える

- 成功: `✅ ビルド成功`
- 失敗: `❌ ビルド失敗`

### 2. TypeScript エラーの確認

`Failed to compile.` が出た場合:

- エラーファイル・行番号・エラー内容を日本語で整理して報告する
- `*.generated.ts` のエラーは codegen 起因の既知問題。先頭に `// @ts-nocheck` が抜けている場合はその旨を伝え、対応方針（A案: codegen.ts の add プラグイン設定）を提示する
- 手書きコードのエラーは原因を特定し、修正方針をユーザーに確認してから対応する

### 3. 警告（Warning）の確認

ビルド出力から以下を抽出して報告する:

- `warn` / `Warning` / `ReferenceError` / `TypeError` を含む行
- `ReferenceError: window is not defined` が出た場合:
  - `ignore-listed frames` であればライブラリ内部のエラーであることを伝える（ビルトには影響しない）
  - ユーザーコードが原因の場合は `typeof window !== 'undefined'` ガードや `dynamic import` で対応を提案する
- その他の警告はファイル名・内容を整理して、直せるものは修正方針を提示する

### 4. 修正の進め方

- generated ファイルのみのエラー → 自動で修正してよい
- 手書きコードのエラー・警告 → 必ず修正方針をユーザーに確認してから進める
- ライブラリ起因の警告（ignore-listed frames）→ 修正困難な旨を伝え、ユーザーの判断を仰ぐ
