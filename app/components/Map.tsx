'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';
import { Station } from '../types/station';
import { Vehicle, VehicleResponse } from '../types/vehicle';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
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
const VehicleMarker = dynamic(() => import('./VehicleMarker'), { ssr: false });

interface MapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}

export default function Map({
  center = [33.5904, 130.4017], // 博多駅をデフォルトに変更
  zoom = 12,
  className = "h-96 w-full"
}: MapProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{total: number, realTime: number, estimated: number}>({total: 0, realTime: 0, estimated: 0});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [stationIcon, setStationIcon] = useState<import('leaflet').DivIcon | null>(null);

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

  // Leafletの初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
              width: 12px;
              height: 12px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            "></div>
          `,
          className: 'station-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          popupAnchor: [0, -6]
        });

        setL(leaflet);
        setStationIcon(icon);
      });
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    fetchStations();
    fetchVehicles();
  }, []);

  // 定期更新（車両データのみ）
  useEffect(() => {
    const interval = setInterval(fetchVehicles, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

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
      {/* ステータス表示 */}
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
        {error && (
          <div className="text-red-500 text-xs">
            {error}
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: 'calc(100% - 24px)', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
          return (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              station={stationPosition}
            />
          );
        })}

      </MapContainer>
    </div>
  );
}