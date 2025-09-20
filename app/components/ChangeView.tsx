'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface ChangeViewProps {
  center: LatLngExpression;
  zoom: number;
}

export default function ChangeView({ center, zoom }: ChangeViewProps) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}