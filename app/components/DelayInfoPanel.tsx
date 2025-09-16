'use client';

import { useEffect, useState } from 'react';
import { TransportVehicle, DelayInfo } from '../types/transport';
import { sampleVehicles, sampleDelays } from '../data/sampleData';

interface DelayInfoPanelProps {
  className?: string;
}

export default function DelayInfoPanel({ className = "" }: DelayInfoPanelProps) {
  const [vehicles, setVehicles] = useState<TransportVehicle[]>(sampleVehicles);
  const [delays, setDelays] = useState<DelayInfo[]>(sampleDelays);

  useEffect(() => {
    const interval = setInterval(() => {
      // 車両データの更新（Mapコンポーネントと同期）
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle => {
          const delayChange = Math.random() > 0.8 ? Math.floor(Math.random() * 3) - 1 : 0;
          const newDelay = Math.max(0, vehicle.delay + delayChange);

          return {
            ...vehicle,
            delay: newDelay,
            status: newDelay > 0 ? 'delayed' : 'on_time',
            lastUpdated: new Date()
          };
        })
      );

      // 遅延情報の更新
      setDelays(prevDelays =>
        prevDelays.map(delay => ({
          ...delay,
          delayMinutes: Math.max(0, delay.delayMinutes + Math.floor(Math.random() * 3) - 1)
        })).filter(delay => delay.delayMinutes > 0)
      );
    }, 5000);

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

  const formatEstimatedTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60));
    return diffMinutes > 0 ? `約${diffMinutes}分後` : '復旧済み';
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
              {delayedVehicles.map(vehicle => {
                const relatedDelay = delays.find(d => d.vehicleId === vehicle.id);
                return (
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
                      </div>
                    </div>
                    {relatedDelay && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <div className="text-sm">
                          <div className="text-gray-700 dark:text-gray-300">
                            <strong>原因:</strong> {relatedDelay.reason}
                          </div>
                          {relatedDelay.estimatedResolution && (
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              <strong>復旧予定:</strong> {formatEstimatedTime(relatedDelay.estimatedResolution)}
                            </div>
                          )}
                          {relatedDelay.affectedStops.length > 0 && (
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              <strong>影響区間:</strong> {relatedDelay.affectedStops.join(' - ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              <strong>追跡中の車両:</strong> {vehicles.length}台
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <strong>平均遅延時間:</strong> {
                vehicles.length > 0
                  ? Math.round(vehicles.reduce((sum, v) => sum + v.delay, 0) / vehicles.length * 10) / 10
                  : 0
              }分
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}