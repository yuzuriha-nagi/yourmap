# WestJR統合提案書

## 調査結果

### WestJRプロジェクトについて
- **プロジェクト**: unyacat/westjr
- **概要**: JR西日本列車走行位置 非公式API Pythonライブラリ
- **ライセンス**: Unlicense
- **対応エリア**: 北陸、関西、岡山、広島、山陰

### 技術的制約
1. **Python専用ライブラリ**: JavaScript/TypeScriptから直接利用不可
2. **非公式API**: 安定性の保証なし
3. **ソースコード非公開**: 内部APIエンドポイントの詳細不明

## 統合アプローチ提案

### 🥇 推奨アプローチ: プロキシサーバー方式

#### 実装方法
1. **Pythonマイクロサービス作成**
   ```python
   # FastAPI使用例
   from fastapi import FastAPI
   import westjr

   app = FastAPI()

   @app.get("/api/westjr/trains/{line}")
   async def get_trains(line: str, area: str):
       jr = westjr.WestJR(line=line, area=area)
       return jr.get_trains()
   ```

2. **Next.js APIルートから呼び出し**
   ```typescript
   // app/api/westjr/route.ts
   export async function GET() {
     const response = await fetch('http://python-service:8000/api/westjr/trains/kobesanyo?area=kinki');
     return Response.json(await response.json());
   }
   ```

#### メリット
- WestJRライブラリをそのまま活用
- 既存のNext.jsアーキテクチャを維持
- スケーラブル

#### デメリット
- インフラ複雑化
- 追加のデプロイメント要件

### 🥈 代替アプローチ: 静的データ + モック

#### 実装方法
1. **西日本エリアの駅データをハードコード**
2. **リアルタイム風のモックデータ生成**
3. **既存のvehicles APIを拡張**

#### メリット
- シンプルな実装
- 即座に動作
- 依存関係なし

## 具体的な実装提案

### Phase 1: 西日本駅データの追加
現在の `stations` APIに西日本エリアの駅データを追加:

```typescript
const westJapanStations = [
  {
    id: 'westjr_osaka',
    name: '大阪',
    location: { latitude: 34.7024, longitude: 135.4959 },
    operator: 'JR-West',
    railway: 'JR-West-Main'
  },
  // 他の西日本主要駅...
];
```

### Phase 2: 西日本車両データの生成
`vehicles` APIで西日本エリアの路線をシミュレート:

```typescript
const westJapanLines = [
  {
    id: 'tokaido_main_west',
    name: 'JR東海道本線(西)',
    operator: 'JR-West',
    stations: ['大阪', '新大阪', '吹田', '茨木', '高槻', '京都']
  },
  // 他の西日本路線...
];
```

## 推奨する次のステップ

1. **Phase 1の実装** (即座に効果が見える)
2. **動作確認とユーザーフィードバック収集**
3. **将来的なWestJR統合の検討**

どのアプローチで進めるかご指示ください。