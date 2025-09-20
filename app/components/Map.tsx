'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';
import { Station } from '../types/station';
import { Vehicle, VehicleResponse } from '../types/vehicle';
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
const VehicleMarker = dynamic(() => import('./VehicleMarker'), {
  ssr: false,
  loading: () => null
});

interface MapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}

export default function Map({
  center = [33.589783, 130.420591], // 博多駅の正確な座標（JR九州エリア）
  zoom = 11,
  className = "h-96 w-full"
}: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{total: number, realTime: number, estimated: number}>({total: 0, realTime: 0, estimated: 0});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [stationIcon, setStationIcon] = useState<import('leaflet').DivIcon | null>(null);
  const [currentTileProvider, setCurrentTileProvider] = useState(0);

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
    },
    {
      name: 'OpenStreetMap France',
      url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>'
    }
  ];

  // タイルプロバイダーを切り替える関数
  const switchTileProvider = () => {
    setCurrentTileProvider((prev) => (prev + 1) % tileProviders.length);
  };

  // 駅データを取得
  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }
      const stationData = await response.json();
      setStations(stationData);
    } catch (err) {
      console.error('Failed to fetch station data:', err);
    }
  };

  // 車両データを取得
  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/vehicles');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const vehicleData: VehicleResponse = await response.json();
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
  }, []);

  // Leafletの初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      import('leaflet').then((leaflet) => {
        // CSS import is handled by the app

        // Fix for default markers in React-Leaflet
        delete (leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // 駅用のアイコンを作成
        const icon = leaflet.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `,
          className: 'station-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });

        setL(leaflet);
        setStationIcon(icon);
      });
    }
  }, [mounted]);

  // 初回データ取得
  useEffect(() => {
    if (mounted) {
      fetchStations();
      fetchVehicles();
    }
  }, [mounted]);

  // 定期更新（車両データのみ）
  useEffect(() => {
    const interval = setInterval(fetchVehicles, 60000); // 1分ごとに更新
    return () => clearInterval(interval);
  }, []);

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
    <div className={className}>
      {/* ステータス表示とタイル切り替えボタン */}
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex space-x-4">
          <span>駅: {stations.length}件</span>
          <span>車両: {vehicleStats.total}台 (リアルタイム: {vehicleStats.realTime}, 推定: {vehicleStats.estimated})</span>
          {isLoading ? (
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          ) : error ? (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          ) : (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={switchTileProvider}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
            title={`現在: ${tileProviders[currentTileProvider].name}`}
          >
            地図切替
          </button>
          {error && (
            <div className="text-red-500 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <MapContainer
          key="main-map"
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          maxBounds={[
            [30.0, 128.0], // 南西角（九州南部）
            [46.0, 146.0]  // 北東角（北海道東部）
          ]}
          maxZoom={18}
          minZoom={8}
        >
        <TileLayer
          key={currentTileProvider}
          attribution={tileProviders[currentTileProvider].attribution}
          url={tileProviders[currentTileProvider].url}
          errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSIjZjAiIGQ9Ik0wIDBoMjU2djI1NkgweiIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiB4PSIxMjgiIHk9IjEzNSI+VGlsZSBFcnJvcjwvdGV4dD48L3N2Zz4="
        />

        {/* API取得駅の表示 */}
        {stationIcon && stations.map(station => (
          <Marker
            key={station.id}
            position={[station.location.latitude, station.location.longitude]}
            icon={stationIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold">{station.name}</div>
                {station.nameEn && (
                  <div className="text-xs text-gray-500">{station.nameEn}</div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  {station.operator?.replace('odpt.Operator:', '')}
                </div>
                <div className="text-xs text-gray-500">
                  {station.railway?.replace('odpt.Railway:', '')}
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

        {/* 車両の表示 */}
        {vehicles.map(vehicle => {
          const stationPosition = vehicle.currentStation ? getStationPosition(vehicle.currentStation) : undefined;

          // Vehicle型をValidatedVehicle型に変換
          const validatedVehicle = {
            ...vehicle,
            destination: vehicle.destination || '不明',
            lastUpdated: vehicle.lastUpdated instanceof Date ? vehicle.lastUpdated : new Date(vehicle.lastUpdated),
            isEstimated: vehicle.isEstimated || false,
            type: vehicle.type as 'train' | 'subway' | 'bus'
          };

          return stationPosition ? (
            <VehicleMarker
              key={vehicle.id}
              vehicle={validatedVehicle}
              position={[stationPosition.latitude, stationPosition.longitude]}
              L={L}
            />
          ) : null;
        })}

      </MapContainer>
      </div>
    </div>
  );
}