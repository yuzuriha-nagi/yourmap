# YourMap - 交通インフラ位置・遅延表示Webアプリ

## プロジェクトの目的
マップを用いて電車やバスなどの交通インフラがどの区間にいるか、および遅延情報を表示するWebアプリケーション。リアルタイムでの交通状況可視化を目指す。

## 技術スタック
- **フロントエンド**: Next.js 15.5.3 (App Router)
- **UI**: React 19.1.0 + Tailwind CSS 4.0
- **言語**: TypeScript 5.0
- **パッケージマネージャー**: npm
- **スタイリング**: Tailwind CSS + CSS Variables (ダークモード対応)
- **フォント**: Geist Sans/Mono
- **ビルドツール**: Turbopack（Next.js内蔵）

## プロジェクト構造
```
yourmap/
├── app/              # Next.js App Router
│   ├── page.tsx      # メインページ
│   ├── layout.tsx    # ルートレイアウト
│   ├── globals.css   # グローバルスタイル
│   └── favicon.ico
├── public/           # 静的アセット
├── package.json      # 依存関係とスクリプト
├── tsconfig.json     # TypeScript設定
├── eslint.config.mjs # ESLint設定
└── postcss.config.mjs # PostCSS設定
```

## 現在の状態
- Next.jsのデフォルトテンプレートがセットアップ済み
- Tailwind CSS、TypeScript、ESLintが設定済み
- マップ機能や交通データ連携はまだ未実装