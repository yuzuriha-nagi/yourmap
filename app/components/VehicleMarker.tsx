'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Vehicle } from '../types/vehicle';

const createVehicleIcon = (type: string, status: string) => {
  const getIconColor = () => {
    switch (status) {
      case 'on_time': return '#22c55e'; // green
      case 'delayed': return '#f59e0b'; // amber
      case 'cancelled': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getIconSymbol = () => {
    switch (type) {
      case 'train': return '🚆';
      case 'subway': return '🚇';
      case 'bus': return '🚌';
      case 'tram': return '🚋';
      default: return '🚍';
    }
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${getIconColor()};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${getIconSymbol()}
      </div>
    `,
    className: 'vehicle-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

interface VehicleMarkerProps {
  vehicle: Vehicle;
  station?: { latitude: number; longitude: number };
}

export default function VehicleMarker({ vehicle, station }: VehicleMarkerProps) {
  const icon = createVehicleIcon(vehicle.type, vehicle.status);

  const formatTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_time': return '定刻運行';
      case 'delayed': return '遅延';
      case 'cancelled': return '運休';
      default: return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'text-green-600';
      case 'delayed': return 'text-amber-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 駅座標がない場合は表示しない
  if (!station) {
    return null;
  }

  return (
    <Marker
      position={[station.latitude, station.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="p-2 min-w-64">
          <div className="font-semibold text-lg mb-2">{vehicle.line}</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">運行会社:</span>
              <span>{vehicle.operator}</span>
            </div>
            {vehicle.trainNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">列車番号:</span>
                <span>{vehicle.trainNumber}</span>
              </div>
            )}
            {vehicle.trainType && (
              <div className="flex justify-between">
                <span className="text-gray-600">列車種別:</span>
                <span>{vehicle.trainType}</span>
              </div>
            )}
            {vehicle.destination && (
              <div className="flex justify-between">
                <span className="text-gray-600">行き先:</span>
                <span>{vehicle.destination}</span>
              </div>
            )}
            {vehicle.currentStation && (
              <div className="flex justify-between">
                <span className="text-gray-600">現在位置:</span>
                <span>{vehicle.currentStation}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">運行状況:</span>
              <span className={getStatusColor(vehicle.status)}>
                {getStatusText(vehicle.status)}
                {vehicle.isEstimated && ' (推定)'}
              </span>
            </div>
            {vehicle.delay > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">遅延時間:</span>
                <span className="text-amber-600">{vehicle.delay}分</span>
              </div>
            )}
            {vehicle.scheduledTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">予定時刻:</span>
                <span>{vehicle.scheduledTime}</span>
              </div>
            )}
            {vehicle.carComposition && (
              <div className="flex justify-between">
                <span className="text-gray-600">編成両数:</span>
                <span>{vehicle.carComposition}両</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">最終更新:</span>
              <span>{formatTime(vehicle.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}