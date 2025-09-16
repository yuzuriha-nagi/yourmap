# 推奨コマンド

## 開発コマンド
```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# ESLintによるコード検証
npm run lint
```

## システムコマンド（macOS Darwin）
```bash
# ディレクトリ一覧表示
ls -la

# ファイル検索
find . -name "*.tsx" -o -name "*.ts"

# 文字列検索
grep -r "search_term" .

# Git操作
git status
git add .
git commit -m "commit message"
git push
```

## 開発サーバー
- ローカル開発: http://localhost:3000
- ホットリロード対応
- Turbopackによる高速ビルド