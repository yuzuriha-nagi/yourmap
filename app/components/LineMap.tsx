'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';
import { Station } from '../types/station';
import { Vehicle, VehicleResponse } from '../types/vehicle';
import { NISHITETSU_SEGMENTS, NISHITETSU_STATIONS, simulateVehiclePositions, VehiclePosition } from '../utils/railwayGeometry';
import { ValidatedVehicle } from '../utils/dataValidation';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-96 w-full rounded"></div>
  }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const VehicleMarker = dynamic(() => import('./VehicleMarker'), {
  ssr: false,
  loading: () => null
});

const ChangeView = dynamic(() => import('./ChangeView'), {
  ssr: false
});

interface LineMapProps {
  lineId: string;
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}

export default function LineMap({
  lineId,
  center = [33.5904, 130.4207],
  zoom = 11,
  className = "h-48 w-full",
  style
}: LineMapProps & { style?: React.CSSProperties }) {
  const [mounted, setMounted] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{total: number, realTime: number, estimated: number}>({total: 0, realTime: 0, estimated: 0});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [stationIcon, setStationIcon] = useState<import('leaflet').DivIcon | null>(null);
  const [currentTileProvider, setCurrentTileProvider] = useState(0);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);

  // タイルプロバイダーの設定
  const tileProviders = [
    {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
      name: 'CartoDB Positron',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  ];

  // タイルプロバイダーを切り替える関数
  const switchTileProvider = () => {
    setCurrentTileProvider((prev) => (prev + 1) % tileProviders.length);
  };

  // 路線固有の駅データを取得
  const fetchLineStations = async () => {
    try {
      // 路線情報を取得
      const lineResponse = await fetch(`/api/lines/${lineId}`);
      if (!lineResponse.ok) {
        throw new Error(`Line API request failed: ${lineResponse.status}`);
      }
      const lineData = await lineResponse.json();

      // 全駅データを取得
      const stationsResponse = await fetch('/api/stations');
      if (!stationsResponse.ok) {
        throw new Error(`Stations API request failed: ${stationsResponse.status}`);
      }
      const allStations = await stationsResponse.json();

      // 路線に関連する駅のみフィルタ
      const lineStations = allStations.filter((station: Station) => {
        return lineData.stations.includes(station.name);
      });

      setStations(lineStations);
    } catch (err) {
      console.error('Failed to fetch station data:', err);
    }
  };

  // 路線固有の車両データを取得
  const fetchLineVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/lines/${lineId}/vehicles`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const vehicleData: VehicleResponse & { lineId: string; lineName: string } = await response.json();

      // lastUpdatedをDate型に変換
      const vehiclesWithDates = vehicleData.vehicles.map(vehicle => ({
        ...vehicle,
        lastUpdated: new Date(vehicle.lastUpdated)
      }));

      setVehicles(vehiclesWithDates);
      setVehicleStats({
        total: vehicleData.total,
        realTime: vehicleData.realTime,
        estimated: vehicleData.estimated
      });

      // 西鉄天神大牟田線の場合は車両位置をシミュレート
      if (lineId === 'nishitetsu_tenjin_omuta_line') {
        const positions = simulateVehiclePositions(NISHITETSU_SEGMENTS, vehiclesWithDates);
        setVehiclePositions(positions);
      }
    } catch (err) {
      setError('車両データの取得に失敗しました');
      console.error('Failed to fetch vehicle data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 駅名から座標を取得するヘルパー関数
  const getStationPosition = (stationName: string): { latitude: number; longitude: number } | undefined => {
    const station = stations.find(s =>
      s.name.includes(stationName) ||
      stationName.includes(s.name.replace(/駅$/, ''))
    );
    return station ? station.location : undefined;
  };

  // マウント状態を設定
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Leafletの初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      // LeafletのCSSを動的に読み込み
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      import('leaflet').then((leaflet) => {
        // Fix for default markers in React-Leaflet
        delete (leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // 駅用のアイコンを作成（正方形、色#7882B2）
        const icon = leaflet.divIcon({
          html: `
            <div style="
              background-color: #7882B2;
              width: 8px;
              height: 8px;
              border: 1px solid white;
              box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'station-marker',
          iconSize: [8, 8],
          iconAnchor: [4, 4],
          popupAnchor: [0, -8]
        });

        setL(leaflet);
        setStationIcon(icon);
      });
    }
  }, [mounted]);

  // 初回データ取得
  useEffect(() => {
    if (mounted && lineId) {
      fetchLineStations();
      fetchLineVehicles();
    }
  }, [mounted, lineId]);

  // 定期更新（車両データのみ）
  useEffect(() => {
    if (!lineId) return;

    const interval = setInterval(fetchLineVehicles, 60000); // 1分ごとに更新
    return () => clearInterval(interval);
  }, [lineId]);

  // サーバーサイドでは何もレンダリングしない
  if (!mounted) {
    return null;
  }

  // Leafletが読み込まれるまでローディング表示
  if (!L || !stationIcon) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">地図を読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {/* ステータス表示 */}
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex space-x-4">
          <span>駅: {stations.length}件</span>
          <span>車両: {vehicleStats.total}台 (推定: {vehicleStats.estimated})</span>
          {isLoading ? (
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          ) : error ? (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          ) : (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          )}
        </div>
      </div>

      {/* デバッグ情報 */}
      <div className="mb-2 text-xs text-gray-600">
        マップ準備状況: Leaflet={L ? '✓' : '✗'}, アイコン={stationIcon ? '✓' : '✗'}, 駅数={stations.length}
      </div>

      {/* マップ表示 */}
      <div style={{ height: '100%', width: '100%', overflow: 'hidden', border: '1px solid #ccc' }}>
        {L && stationIcon ? (
          <MapContainer
            key={`map-${lineId}-${mounted}`}
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
            attributionControl={true}
          >
            <ChangeView center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {/* 西鉄天神大牟田線の路線表示 */}
            {lineId === 'nishitetsu_tenjin_omuta_line' && (
              <>
                {/* 駅間の線路 */}
                {NISHITETSU_SEGMENTS.map((segment, index) => (
                  <Polyline
                    key={`segment-${index}`}
                    positions={segment.coordinates}
                    pathOptions={{
                      color: '#FF6B00', // 西鉄のオレンジ色
                      weight: 4,
                      opacity: 0.8
                    }}
                  />
                ))}

                {/* 西鉄の駅表示 */}
                {NISHITETSU_STATIONS.map(station => (
                  <Marker
                    key={`nishitetsu-${station.index}`}
                    position={[station.latitude, station.longitude]}
                    icon={stationIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <div className="font-semibold text-sm">{station.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          西日本鉄道
                        </div>
                        <div className="text-xs text-gray-500">
                          {station.index + 1}番目の駅
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* 車両位置表示 */}
                {vehiclePositions.map(pos => {
                  const vehicle = vehicles.find(v => v.id === pos.vehicleId);
                  return vehicle ? (
                    <VehicleMarker
                      key={pos.vehicleId}
                      vehicle={vehicle as ValidatedVehicle}
                      position={[pos.latitude, pos.longitude]}
                      L={L}
                    />
                  ) : null;
                })}
              </>
            )}

            {/* 他の路線の駅表示 */}
            {lineId !== 'nishitetsu_tenjin_omuta_line' && stations.map(station => (
              <Marker
                key={station.id}
                position={[station.location.latitude, station.location.longitude]}
                icon={stationIcon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{station.name}</div>
                    {station.nameEn && (
                      <div className="text-xs text-gray-500">{station.nameEn}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1">
                      {station.operator?.replace('odpt.Operator:', '')}
                    </div>
                    {station.stationCode && (
                      <div className="text-xs font-mono bg-gray-100 px-1 rounded mt-1">
                        {station.stationCode}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-gray-600">地図を初期化中...</div>
          </div>
        )}
      </div>
    </div>
  );
}