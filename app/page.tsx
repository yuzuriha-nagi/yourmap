'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./components/Map'), {
  ssr: false
});

const DelayInfoPanel = dynamic(() => import('./components/DelayInfoPanel'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            YourMap - 交通インフラ位置追跡
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            リアルタイムで電車・バスの位置と遅延情報を表示
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  🗺️ リアルタイムマップ
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    LIVE
                  </span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  5秒間隔で自動更新 • クリックで詳細情報を表示
                </p>
              </div>
              <div className="p-4">
                <Map className="h-96 w-full rounded-lg" />
              </div>
            </div>
          </div>

          <div>
            <DelayInfoPanel />
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-800 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>🚧 デモ版 - サンプルデータを使用しています</p>
            <p className="mt-1">
              実際の交通データと連携するには、各交通機関のAPIを統合してください
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
