export interface Position {
  latitude: number;
  longitude: number;
}

export interface TransportVehicle {
  id: string;
  type: 'train' | 'bus' | 'tram' | 'subway';
  line: string;
  operator: string;
  currentPosition: Position;
  destination: string;
  nextStop?: string;
  delay: number; // 分単位での遅延時間
  status: 'on_time' | 'delayed' | 'cancelled' | 'unknown';
  lastUpdated: Date;
}

export interface TransportRoute {
  id: string;
  name: string;
  type: 'train' | 'bus' | 'tram' | 'subway';
  color: string;
  stops: TransportStop[];
  path: Position[];
}

export interface TransportStop {
  id: string;
  name: string;
  position: Position;
  type: 'station' | 'bus_stop' | 'tram_stop';
}

export interface DelayInfo {
  vehicleId: string;
  delayMinutes: number;
  reason?: string;
  affectedStops: string[];
  estimatedResolution?: Date;
}

export interface TrafficData {
  vehicles: TransportVehicle[];
  routes: TransportRoute[];
  delays: DelayInfo[];
  lastFetch: Date;
}