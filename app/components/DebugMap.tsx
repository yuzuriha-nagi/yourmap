'use client';

import { useEffect, useState } from 'react';

export default function DebugMap() {
  const [status, setStatus] = useState<string>('初期化中...');
  const [leafletVersion, setLeafletVersion] = useState<string>('未確認');

  useEffect(() => {
    console.log('DebugMap: Starting debug');
    setStatus('Leaflet読み込み中...');

    // Leafletの動的インポートをテスト
    import('leaflet').then((L) => {
      console.log('DebugMap: Leaflet loaded successfully', L);
      setLeafletVersion(L.version || 'バージョン不明');
      setStatus('Leaflet読み込み完了');

      // react-leafletのテスト
      import('react-leaflet').then((ReactLeaflet) => {
        console.log('DebugMap: react-leaflet loaded successfully', ReactLeaflet);
        setStatus('react-leaflet読み込み完了');
      }).catch((err) => {
        console.error('DebugMap: react-leaflet load failed', err);
        setStatus(`react-leaflet読み込み失敗: ${err.message}`);
      });
    }).catch((err) => {
      console.error('DebugMap: Leaflet load failed', err);
      setStatus(`Leaflet読み込み失敗: ${err.message}`);
    });
  }, []);

  return (
    <div className="h-96 w-full border border-gray-300 p-4">
      <h3 className="text-lg font-bold mb-2">マップデバッグ情報</h3>
      <div className="space-y-2">
        <p><strong>ステータス:</strong> {status}</p>
        <p><strong>Leafletバージョン:</strong> {leafletVersion}</p>
        <p><strong>CSR確認:</strong> {typeof window !== 'undefined' ? 'クライアントサイド' : 'サーバーサイド'}</p>
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p className="text-sm">
            ブラウザのデベロッパーツール → Console タブで詳細なログを確認してください
          </p>
        </div>
      </div>
    </div>
  );
}