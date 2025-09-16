import { TransportVehicle, TransportRoute, DelayInfo, TrafficData } from '../types/transport';

export const sampleVehicles: TransportVehicle[] = [
  {
    id: 'train_001',
    type: 'train',
    line: 'JR山手線',
    operator: 'JR東日本',
    currentPosition: { latitude: 35.6814, longitude: 139.7661 }, // 新宿駅付近
    destination: '品川',
    nextStop: '代々木',
    delay: 2,
    status: 'delayed',
    lastUpdated: new Date()
  },
  {
    id: 'train_002',
    type: 'train',
    line: 'JR山手線',
    operator: 'JR東日本',
    currentPosition: { latitude: 35.6751, longitude: 139.7040 }, // 渋谷駅付近
    destination: '東京',
    nextStop: '原宿',
    delay: 0,
    status: 'on_time',
    lastUpdated: new Date()
  },
  {
    id: 'bus_001',
    type: 'bus',
    line: '都バス01系統',
    operator: '東京都交通局',
    currentPosition: { latitude: 35.6895, longitude: 139.6917 }, // 新宿西口付近
    destination: '銀座',
    nextStop: '新宿三丁目',
    delay: 5,
    status: 'delayed',
    lastUpdated: new Date()
  },
  {
    id: 'subway_001',
    type: 'subway',
    line: '東京メトロ丸ノ内線',
    operator: '東京メトロ',
    currentPosition: { latitude: 35.6911, longitude: 139.7006 }, // 新宿三丁目駅付近
    destination: '池袋',
    nextStop: '新宿御苑前',
    delay: 0,
    status: 'on_time',
    lastUpdated: new Date()
  }
];

export const sampleRoutes: TransportRoute[] = [
  {
    id: 'yamanote_line',
    name: 'JR山手線',
    type: 'train',
    color: '#9ACD32',
    stops: [
      { id: 'tokyo', name: '東京', position: { latitude: 35.6762, longitude: 139.6503 }, type: 'station' },
      { id: 'shimbashi', name: '新橋', position: { latitude: 35.6666, longitude: 139.7587 }, type: 'station' },
      { id: 'shibuya', name: '渋谷', position: { latitude: 35.6751, longitude: 139.7040 }, type: 'station' },
      { id: 'shinjuku', name: '新宿', position: { latitude: 35.6814, longitude: 139.7661 }, type: 'station' },
      { id: 'ikebukuro', name: '池袋', position: { latitude: 35.7295, longitude: 139.7109 }, type: 'station' }
    ],
    path: [
      { latitude: 35.6762, longitude: 139.6503 },
      { latitude: 35.6666, longitude: 139.7587 },
      { latitude: 35.6751, longitude: 139.7040 },
      { latitude: 35.6814, longitude: 139.7661 },
      { latitude: 35.7295, longitude: 139.7109 }
    ]
  }
];

export const sampleDelays: DelayInfo[] = [
  {
    vehicleId: 'train_001',
    delayMinutes: 2,
    reason: '乗客混雑のため',
    affectedStops: ['新宿', '代々木', '原宿'],
    estimatedResolution: new Date(Date.now() + 5 * 60 * 1000) // 5分後
  },
  {
    vehicleId: 'bus_001',
    delayMinutes: 5,
    reason: '交通渋滞のため',
    affectedStops: ['新宿西口', '新宿三丁目'],
    estimatedResolution: new Date(Date.now() + 10 * 60 * 1000) // 10分後
  }
];

export const sampleTrafficData: TrafficData = {
  vehicles: sampleVehicles,
  routes: sampleRoutes,
  delays: sampleDelays,
  lastFetch: new Date()
};

// 東京の主要駅座標
export const tokyoStations = {
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  shimbashi: { latitude: 35.6666, longitude: 139.7587 },
  shibuya: { latitude: 35.6751, longitude: 139.7040 },
  shinjuku: { latitude: 35.6814, longitude: 139.7661 },
  ikebukuro: { latitude: 35.7295, longitude: 139.7109 },
  ueno: { latitude: 35.7137, longitude: 139.7767 },
  akihabara: { latitude: 35.6984, longitude: 139.7730 }
};