'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import VehicleMarker from './VehicleMarker';
import { TransportVehicle } from '../types/transport';
import { fukuokaStations } from '../data/sampleData';
import { transportApiService } from '../services/transportApi';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 駅用のアイコンを作成
const stationIcon = L.divIcon({
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
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 車両位置データを取得
  const fetchVehicleData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vehicleData = await transportApiService.getEstimatedVehiclePositions();
      setVehicles(vehicleData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('車両位置データの取得に失敗しました');
      console.error('Failed to fetch vehicle data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回データ取得
  useEffect(() => {
    fetchVehicleData();
  }, []);

  // リアルタイム更新
  useEffect(() => {
    const interval = setInterval(fetchVehicleData, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <div>
          最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
          {isLoading ? (
            <span className="ml-2 inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          ) : error ? (
            <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          ) : (
            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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

        {/* 主要駅の表示 */}
        {Object.entries(fukuokaStations).map(([name, position]) => (
          <Marker
            key={name}
            position={[position.latitude, position.longitude]}
            icon={stationIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-gray-600">駅</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 交通車両の表示 */}
        {vehicles.map(vehicle => (
          <VehicleMarker key={vehicle.id} vehicle={vehicle} />
        ))}
      </MapContainer>
    </div>
  );
}