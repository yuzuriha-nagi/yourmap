'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngExpression } from 'leaflet';

// Leafletコンポーネントを動的インポート
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-96 w-full bg-gray-100 flex items-center justify-center">地図を読み込み中...</div> }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

interface SimpleMapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}

export default function SimpleMap({
  center = [33.5904, 130.4017], // 博多駅
  zoom = 12,
  className = "h-96 w-full"
}: SimpleMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // サーバーサイドでは何もレンダリングしない
  if (!mounted) {
    return null;
  }

  return (
    <div className={className}>
      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    </div>
  );
}