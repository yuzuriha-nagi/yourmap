'use client';

import { useEffect, useState } from 'react';
import { Vehicle, VehicleResponse } from '../types/vehicle';

interface DelayInfoPanelProps {
  className?: string;
}

export default function DelayInfoPanel({ className = "" }: DelayInfoPanelProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{total: number, realTime: number, estimated: number}>({total: 0, realTime: 0, estimated: 0});
  const [, setIsLoading] = useState<boolean>(true);

  // データを取得する関数
  const fetchData = async () => {
    try {
      setIsLoading(true);
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
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回データ取得
  useEffect(() => {
    fetchData();
  }, []);

  // 定期更新
  useEffect(() => {
    const interval = setInterval(fetchData, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const delayedVehicles = vehicles.filter(vehicle => vehicle.delay > 0);
  const onTimeVehicles = vehicles.filter(vehicle => vehicle.delay === 0);

  const getDelayIcon = (type: string) => {
    switch (type) {
      case 'train': return '🚆';
      case 'subway': return '🚇';
      case 'bus': return '🚌';
      default: return '🚍';
    }
  };


  return (
    <div className={`space-y-6 ${className}`}>
      {/* 遅延情報 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            ⚠️ 遅延情報
            {delayedVehicles.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                {delayedVehicles.length}件
              </span>
            )}
          </h3>
        </div>
        <div className="p-4">
          {delayedVehicles.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">
              🎉 現在、遅延は発生していません
            </div>
          ) : (
            <div className="space-y-3">
              {delayedVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="border border-amber-200 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getDelayIcon(vehicle.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {vehicle.line}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {vehicle.operator} → {vehicle.destination}
                        </div>
                        {vehicle.trainNumber && (
                          <div className="text-xs text-gray-500">
                            {vehicle.trainNumber} {vehicle.trainType}
                          </div>
                        )}
                        {vehicle.currentStation && (
                          <div className="text-xs text-gray-500">
                            現在: {vehicle.currentStation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-semibold">
                        {vehicle.delay}分遅延
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.lastUpdated.toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {vehicle.isEstimated && (
                        <div className="text-xs text-blue-500">推定</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 運行状況 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            📊 運行状況
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {onTimeVehicles.length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                定刻運行
              </div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {delayedVehicles.length}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                遅延発生
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>追跡中の車両:</strong> {vehicleStats.total}台 (リアルタイム: {vehicleStats.realTime}, 推定: {vehicleStats.estimated})
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>平均遅延時間:</strong> {
                vehicles.length > 0
                  ? Math.round(vehicles.reduce((sum, v) => sum + v.delay, 0) / vehicles.length * 10) / 10
                  : 0
              }分
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>運行路線:</strong> JR鹿児島本線、JR博多南線、地下鉄空港線、地下鉄箱崎線、地下鉄七隈線
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}