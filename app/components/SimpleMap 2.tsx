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
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SimpleMap: Component mounting');
    setIsClient(true);
  }, []);

  if (!isClient) {
    console.log('SimpleMap: Waiting for client-side rendering');
    return <div className={className + " bg-gray-200 flex items-center justify-center"}>地図を読み込み中...</div>;
  }

  console.log('SimpleMap: Client-side rendering, creating map');

  try {
    return (
      <div className={className}>
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
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-800 p-2 text-sm">
            エラー: {error}
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('SimpleMap render error:', err);
    return <div className={className + " bg-red-100 flex items-center justify-center"}>地図の読み込みでエラーが発生しました</div>;
  }
}