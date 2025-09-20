'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 動的インポート
const LineMap = dynamic(() => import('../../components/LineMap'), {
  ssr: false
});

const DelayInfoPanel = dynamic(() => import('../../components/DelayInfoPanel'), {
  ssr: false
});

// 路線データの型定義
interface LineData {
  id: string;
  name: string;
  operator: string;
  area: string;
  type: 'train' | 'subway' | 'bus';
  color: string;
  description: string;
  stations: string[];
  bounds: {
    center: [number, number];
    zoom: number;
  };
}

// 路線データはAPIから取得

export default function LinePage() {
  const params = useParams();
  const lineId = params?.lineId as string;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.589783, 130.420591]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [stationsData, setStationsData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<LineData | null>(null);
  const [stationFilter, setStationFilter] = useState<'all' | 'local' | 'express' | 'limited'>('all');

  // 西鉄天神大牟田線の停車パターン定義
  const getStationCategories = () => {
    if (lineId !== 'nishitetsu_tenjin_omuta_line') {
      // 他の路線では全駅普通停車として扱う
      return {
        local: lineData?.stations || [],
        express: lineData?.stations || [],
        limited: lineData?.stations || []
      };
    }

    // 西鉄天神大牟田線の実際の停車パターン
    const expressStations = [
      '西鉄福岡（天神）', '薬院', '大橋', '春日原', '下大利', '西鉄二日市',
      '朝倉街道', '筑紫', '三国が丘', '西鉄小郡', '宮の陣', '久留米',
      '花畑', '大善寺', '新栄町', '西鉄柳川', '大牟田'
    ];

    const limitedExpressStations = [
      '西鉄福岡（天神）', '薬院', '大橋', '春日原', '西鉄二日市',
      '久留米', '花畑', '大善寺', '新栄町', '西鉄柳川', '大牟田'
    ];

    return {
      local: lineData?.stations || [], // 普通は全駅停車
      express: expressStations,
      limited: limitedExpressStations
    };
  };

  const stationCategories = getStationCategories();

  // フィルタリングされた駅リスト
  const getFilteredStations = () => {
    if (!lineData) return [];

    switch (stationFilter) {
      case 'local':
        return stationCategories.local;
      case 'express':
        return stationCategories.express;
      case 'limited':
        return stationCategories.limited;
      default:
        return lineData.stations;
    }
  };

  const filteredStations = getFilteredStations();

  // APIから路線データと駅データを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 駅データを取得
        const stationsResponse = await fetch('/api/stations');
        if (stationsResponse.ok) {
          const stations = await stationsResponse.json();
          setStationsData(stations);
        }

        // 路線データを取得（APIエンドポイントが存在する場合）
        const lineResponse = await fetch(`/api/lines/${lineId}`);
        if (lineResponse.ok) {
          const line = await lineResponse.json();
          setLineData(line);
          // 初期ズームレベルを設定
          if (line.bounds && line.bounds.zoom) {
            setMapZoom(line.bounds.zoom);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (mounted) {
      fetchData();
    }
  }, [mounted, lineId]);

  // 駅名からAPIデータの座標を取得する関数
  const getStationCoordinates = (stationName: string): [number, number] | null => {
    const station = stationsData.find(s => s.name === stationName);
    if (station && station.location) {
      return [station.location.latitude, station.location.longitude];
    }
    return null;
  };

  const handleStationClick = (stationName: string) => {
    const coords = getStationCoordinates(stationName);
    if (coords) {
      setMapCenter(coords);
      // ズームレベルを15に設定してより拡大表示
      setMapZoom(15);
    }
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lineData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">路線が見つかりません</h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* ヘッダー */}
      <header className="bg-black shadow-sm border-b border-black border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-blue-400 hover:text-blue-300 mr-4"
              >
                ← ホーム
              </Link>
              <div className="flex items-center">
                <div
                  className="w-6 h-6 rounded-full mr-3"
                  style={{ backgroundColor: lineData.color }}
                ></div>
                <div>
                  <h1 className="text-xl font-bold text-white font-audiowide">
                    {lineData.name}
                  </h1>
                  <p className="text-sm text-white">{lineData.description}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">現在時刻</div>
              <div className="font-mono text-lg text-white">
                {mounted ? currentTime.toLocaleTimeString('ja-JP') : '--:--:--'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ maxWidth: '960px' }}>
        {/* マップエリア */}
        <div className="mb-12 bg-black rounded-lg shadow-sm border max-w-full" style={{ width: '100%', maxWidth: '960px', margin: '0 auto 80px auto' }}>
          <div className="p-4 border-b border-black">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center font-audiowide">
                🗺️ 路線図・リアルタイム位置
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  LIVE
                </span>
              </h2>
              <div className="text-sm text-white">
                自動更新: 1分間隔
              </div>
            </div>
          </div>
          <div className="w-full max-w-full px-4 py-4 pb-16">
            <LineMap
              lineId={lineId}
              center={mapCenter}
              zoom={mapZoom}
              className="rounded-lg w-full h-64 md:h-96"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-full" style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
          {/* 駅一覧エリア */}
          <div className="lg:col-span-3">

            {/* 駅一覧 */}
            <div className="bg-black rounded-lg shadow-sm border">
              <div className="p-4 border-b border-black">
                <div className="flex flex-col space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    🚉 停車駅一覧 ({filteredStations.length}駅)
                  </h3>

                  {/* カテゴリフィルター */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStationFilter('all')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        stationFilter === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      すべて ({lineData.stations.length})
                    </button>
                    <button
                      onClick={() => setStationFilter('local')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        stationFilter === 'local'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      普通 ({stationCategories.local.length})
                    </button>
                    <button
                      onClick={() => setStationFilter('express')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        stationFilter === 'express'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      急行 ({stationCategories.express.length})
                    </button>
                    <button
                      onClick={() => setStationFilter('limited')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        stationFilter === 'limited'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      特急 ({stationCategories.limited.length})
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {/* デスクトップ表示 */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredStations.map((station, index) => {
                      const originalIndex = lineData.stations.indexOf(station);
                      return (
                      <button
                        key={station}
                        className="flex items-center p-4 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        onClick={() => handleStationClick(station)}
                      >
                        <div
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: lineData.color }}
                        ></div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="font-medium text-sm text-white truncate">{station}</div>
                          <div className="text-xs text-gray-300">
                            {originalIndex + 1}番目
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>

                {/* モバイル表示 - 3駅ずつ縦スクロール */}
                <div className="block md:hidden">
                  <div className="overflow-y-auto max-h-96">
                    <div className="space-y-3">
                      {Array.from({ length: Math.ceil(filteredStations.length / 3) }, (_, groupIndex) => (
                        <div key={`group-${groupIndex}`} className="grid grid-cols-3 gap-2">
                          {filteredStations.slice(groupIndex * 3, (groupIndex + 1) * 3).map((station, stationIndex) => {
                            const originalIndex = lineData.stations.indexOf(station);
                            return (
                            <button
                              key={station}
                              className="flex flex-col items-center p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-all duration-200 shadow-sm text-center"
                              onClick={() => handleStationClick(station)}
                            >
                              <div
                                className="w-3 h-3 rounded-full mb-2 flex-shrink-0"
                                style={{ backgroundColor: lineData.color }}
                              ></div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs text-white truncate">{station}</div>
                                <div className="text-xs text-gray-400">
                                  {originalIndex + 1}
                                </div>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    ↑ 上下にスクロールして他の駅を表示 ↓
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 運行情報パネル */}
            <DelayInfoPanel lineId={lineId} />

            {/* 路線情報 */}
            <div className="bg-black rounded-lg shadow-sm border">
              <div className="p-4 border-b border-black">
                <h3 className="text-lg font-semibold text-white">📊 路線情報</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white">運営会社</span>
                  <span className="font-medium">{lineData.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">エリア</span>
                  <span className="font-medium">{lineData.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">種別</span>
                  <span className="font-medium">
                    {lineData.type === 'train' ? '鉄道' : lineData.type === 'subway' ? '地下鉄' : 'バス'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">駅数</span>
                  <span className="font-medium">{lineData.stations.length}駅</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">路線色</span>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: lineData.color }}
                    ></div>
                    <span className="font-mono text-sm">{lineData.color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 凡例 */}
            <div className="bg-black rounded-lg shadow-sm border">
              <div className="p-4 border-b border-black">
                <h3 className="text-lg font-semibold text-white">🗺️ 凡例</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">駅</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">運行中車両（定刻）</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">運行中車両（遅延）</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">運行中車両（大幅遅延）</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}