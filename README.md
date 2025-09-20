# Railytics - 交通インフラ位置追跡アプリ

福岡地域の電車・バスのリアルタイム位置情報と遅延状況を表示する地図アプリケーションです。

## 機能

- **リアルタイム車両位置表示**: 電車・バス・地下鉄の現在位置を地図上に表示
- **遅延情報パネル**: 運行遅延の詳細情報と原因を表示
- **運行状況統計**: 定刻運行と遅延車両の統計情報
- **自動更新**: 30秒間隔でのデータ自動更新

## API統合設定

### 1. 公共交通オープンデータ協議会API（推奨）

1. [公共交通オープンデータ協議会](https://developer.odpt.org/)でアカウント登録
2. APIキーを取得
3. `.env.local`にAPIキーを設定：

```bash
NEXT_PUBLIC_ODPT_API_KEY=your_api_key_here
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 2. 開発モード（モックデータ使用）

APIキーなしで開発・デモを行う場合：

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを確認し、必要に応じて設定を調整：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ODPT_API_KEY=your_api_key_here
NEXT_PUBLIC_USE_MOCK_DATA=true  # デモモード
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが利用可能になります。

## 技術スタック

- **フレームワーク**: Next.js 15.5.3 (React 19)
- **地図ライブラリ**: React Leaflet + OpenStreetMap
- **スタイリング**: Tailwind CSS 4.0
- **TypeScript**: 型安全性とコード品質の向上
- **API統合**: 公共交通オープンデータ協議会API

## 地域対応

現在は福岡地域に特化していますが、以下の交通機関をサポート：

- **JR九州**: 鹿児島本線
- **福岡市地下鉄**: 空港線
- **西日本鉄道**: バス路線

## トラブルシューティング

### よくある問題

1. **車両が表示されない**
   - `.env.local`の設定を確認
   - ブラウザの開発者ツールでエラーをチェック
   - `NEXT_PUBLIC_USE_MOCK_DATA=true`でモックデータモードを試す

2. **API接続エラー**
   - APIキーが有効か確認
   - ネットワーク接続を確認
   - APIのレート制限に達していないか確認

## Next.js について

このプロジェクトは[Next.js](https://nextjs.org)で構築されています。

詳細については以下を参照：
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub repository](https://github.com/vercel/next.js)
