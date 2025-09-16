# コードスタイルと規約

## TypeScript設定
- **Target**: ES2017
- **Strict mode**: 有効
- **JSX**: preserve
- **Module**: esnext
- **Path mapping**: `@/*` で相対パス指定可能

## コーディング規約
- **ファイル命名**: kebab-case（例: `page.tsx`, `layout.tsx`）
- **コンポーネント命名**: PascalCase（例: `Home`, `MapComponent`）
- **関数**: camelCase
- **型定義**: PascalCase
- **CSS**: Tailwind CSS utility classes使用
- **インポート**: ES6 modules

## ESLint設定
- Next.js推奨設定（core-web-vitals）
- TypeScript対応
- 除外ファイル: node_modules, .next, out, build

## スタイル
- **CSS Framework**: Tailwind CSS 4.0
- **ダークモード**: CSS Variables使用（`prefers-color-scheme`対応）
- **フォント**: Geist Sans（メイン）、Geist Mono（コード用）
- **レスポンシブ**: モバイルファースト設計

## ファイル構成
- **Pages**: `app/` ディレクトリ（App Router）
- **Components**: コンポーネントは適切なディレクトリに分類
- **Styles**: `globals.css` + Tailwind utilities
- **Assets**: `public/` ディレクトリ