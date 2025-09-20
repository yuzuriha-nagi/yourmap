'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// 路線データの型定義
interface Line {
  id: string;
  name: string;
  operator: string;
  area: string;
  type: 'train' | 'subway' | 'bus';
  color: string;
  description: string;
  stations: string[];
}

export default function Home() {
  const [lines, setLines] = useState<Line[]>([]);

  // APIから路線データを取得
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const response = await fetch('/api/lines');
        if (response.ok) {
          const linesData = await response.json();
          setLines(linesData);
        }
      } catch (error) {
        console.error('Failed to fetch lines:', error);
      }
    };

    fetchLines();
  }, []);

  const [areaFilter, setAreaFilter] = useState<string>('全て');
  const areas = ['全て', '福岡'];

  const filteredLines = areaFilter === '全て'
    ? lines
    : lines.filter(line => line.area === areaFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <header className="bg-black shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white font-audiowide">
              Railytics
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* エリアフィルター */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">エリア選択</h2>
          <div className="flex flex-wrap gap-2">
            {areas.map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  areaFilter === area
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-black text-white border-black hover:bg-gray-900'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* 路線一覧 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">対応路線一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLines.map(line => (
              <Link
                key={line.id}
                href={`/lines/${line.id}`}
                className="block bg-black rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: line.color }}
                    ></div>
                    <h3 className="font-semibold text-white font-audiowide">
                      {line.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{line.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="bg-black px-2 py-1 rounded">{line.area}</span>
                    <span>{line.stations.length}駅</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="bg-black rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-white mb-4">システム情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{lines.length}</div>
              <div className="text-sm text-gray-300">対応路線</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {lines.reduce((sum, line) => sum + line.stations.length, 0)}
              </div>
              <div className="text-sm text-gray-300">対応駅数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{areas.length - 1}</div>
              <div className="text-sm text-gray-300">対応エリア</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">1分</div>
              <div className="text-sm text-gray-300">更新間隔</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>デモ版 - JR九州エリアのサンプルデータを使用</p>
            <p className="mt-1">
              実データとの連携により、より詳細な運行情報の表示が可能です
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
