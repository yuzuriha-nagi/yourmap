'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import { ValidatedVehicle } from '../utils/dataValidation';

// 車両アイコン作成関数をコンポーネント外で定義
const createVehicleIcon = (vehicle: ValidatedVehicle, L: any): DivIcon => {
  // 遅延状況に基づいて色を決定
  const getVehicleColor = (delay: number) => {
    if (delay === 0) return '#10B981'; // 緑 - 定刻
    if (delay <= 3) return '#F59E0B'; // 黄 - 軽微な遅延
    if (delay <= 10) return '#EF4444'; // 赤 - 遅延
    return '#7C2D12'; // 暗赤 - 大幅遅延
  };

  // 列車種別に基づいてアイコンを決定
  const getTrainIcon = (trainType: string) => {
    switch (trainType) {
      case '特急': return '🚅';
      case '急行': return '🚄';
      case '普通': return '🚃';
      default: return '🚆';
    }
  };

  const color = getVehicleColor(vehicle.delay);
  const trainIcon = getTrainIcon(vehicle.trainType || '普通');

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      ">
        ${trainIcon}
        ${vehicle.delay > 0 ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #EF4444;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          ">
            ${vehicle.delay}
          </div>
        ` : ''}
      </div>
    `,
    className: 'vehicle-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface VehicleMarkerProps {
  vehicle: ValidatedVehicle;
  position: [number, number];
  L?: typeof import('leaflet');
}

export default function VehicleMarker({ vehicle, position, L }: VehicleMarkerProps) {
  const [vehicleIcon, setVehicleIcon] = useState<DivIcon | null>(null);

  useEffect(() => {
    if (!L) return;
    const icon = createVehicleIcon(vehicle, L);
    setVehicleIcon(icon);
  }, [L, vehicle.delay, vehicle.trainType]);

  if (!vehicleIcon || !L) {
    return null;
  }

  return (
    <Marker position={position as LatLngExpression} icon={vehicleIcon}>
      <Popup>
        <div className="text-sm">
          <div className="font-semibold text-blue-600 mb-2">
            {vehicle.trainType || '普通'} {vehicle.trainNumber || ''}
          </div>

          <div className="space-y-1">
            <div>
              <span className="font-medium">行き先:</span> {vehicle.destination}
            </div>

            {vehicle.currentStation && (
              <div>
                <span className="font-medium">現在駅:</span> {vehicle.currentStation}
              </div>
            )}

            <div>
              <span className="font-medium">運行状況:</span>{' '}
              <span className={`font-semibold ${
                vehicle.delay === 0
                  ? 'text-green-600'
                  : vehicle.delay <= 3
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {vehicle.delay === 0 ? '定刻' : `${vehicle.delay}分遅延`}
              </span>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              最終更新: {new Date(vehicle.lastUpdated).toLocaleTimeString('ja-JP')}
              {vehicle.isEstimated && (
                <span className="ml-1 text-blue-500">(推定)</span>
              )}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}