export interface Vehicle {
  id: string;
  type: 'train' | 'bus' | 'subway';
  line: string;
  operator: string;
  trainNumber?: string;
  trainType?: string;
  currentStation?: string;
  fromStation?: string;
  toStation?: string;
  destination?: string;
  delay: number;
  status: 'on_time' | 'delayed' | 'cancelled';
  carComposition?: number;
  scheduledTime?: string;
  isEstimated?: boolean;
  pattern?: string;
  direction?: string;
  lastUpdated: Date;
}

export interface VehicleResponse {
  vehicles: Vehicle[];
  total: number;
  realTime: number;
  estimated: number;
  lastUpdated: string;
}