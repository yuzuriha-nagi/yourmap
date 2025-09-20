'use client';

import React, { useEffect, useState } from 'react';
import { Vehicle, VehicleResponse } from '../types/vehicle';

interface DelayInfoPanelProps {
  className?: string;
  lineId?: string; // 路線固有の表示用
}

export default function DelayInfoPanel({ className = "", lineId }: DelayInfoPanelProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<{total: number, realTime: number, estimated: number}>({total: 0, realTime: 0, estimated: 0});
  const [, setIsLoading] = useState<boolean>(true);
  const [previousVehicles, setPreviousVehicles] = useState<Vehicle[]>([]);

  // データを取得する関数
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const apiUrl = lineId ? `/api/lines/${lineId}/vehicles` : '/api/vehicles';
      const response = await fetch(apiUrl);

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

      // 前回のデータを保存
      setPreviousVehicles(vehicles);

      // 現在のデータを更新
      setVehicles(vehiclesWithDates);
      setVehicleStats({
        total: vehicleData.total,
        realTime: vehicleData.realTime,
        estimated: vehicleData.estimated
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // エラー時はダミーデータを表示
      setVehicles([]);
      setVehicleStats({ total: 0, realTime: 0, estimated: 0 });
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
    const interval = setInterval(fetchData, 60000); // 1分ごとに更新
    return () => clearInterval(interval);
  }, [lineId]);

  // 現在遅延している車両のみを表示（以前のデータではなく最新のデータのみ）
  const delayedVehicles = vehicles.filter(vehicle => vehicle.delay > 0);
  const onTimeVehicles = vehicles.filter(vehicle => vehicle.delay === 0);

  // 遅延が解消された車両をログに出力（デバッグ用）
  React.useEffect(() => {
    if (previousVehicles.length > 0) {
      const resolvedDelays = previousVehicles.filter(prevVehicle => {
        const currentVehicle = vehicles.find(v => v.id === prevVehicle.id);
        return prevVehicle.delay > 0 && currentVehicle && currentVehicle.delay === 0;
      });

      if (resolvedDelays.length > 0) {
        console.log(`遅延解消: ${resolvedDelays.length}件の車両の遅延が解消されました`);
      }
    }
  }, [vehicles, previousVehicles]);

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
      <div className="bg-black rounded-lg shadow-sm border max-w-full overflow-hidden">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white flex items-center">
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
            <div className="text-sm text-gray-300 text-center py-4">
              🎉 現在、遅延は発生していません
            </div>
          ) : (
            <div className="space-y-3">
              {delayedVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="border border-amber-600 rounded-lg p-3 bg-amber-900/20 max-w-full overflow-hidden"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">{getDelayIcon(vehicle.type)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">
                          {vehicle.line}
                        </div>
                        <div className="text-sm text-gray-300 truncate">
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
              <strong>運行路線:</strong> JR東海道本線(西)、JR大阪環状線、JR山陽本線、JR北陸本線、JR山陰本線
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>データ種別:</strong> シミュレーション（時刻表ベース）
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>遅延要因:</strong> ラッシュ時混雑、天候、路線特性を考慮
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <strong>拡張機能:</strong> 時刻表ベース運行シミュレーション、路線別遅延傾向分析、ラッシュ時・天候要因考慮
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}