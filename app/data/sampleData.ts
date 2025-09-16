import { TransportVehicle, TransportRoute, DelayInfo, TrafficData } from '../types/transport';

export const sampleVehicles: TransportVehicle[] = [
  {
    id: 'train_001',
    type: 'train',
    line: 'JR鹿児島本線',
    operator: 'JR九州',
    currentPosition: { latitude: 33.5904, longitude: 130.4017 }, // 博多駅付近
    destination: '小倉',
    nextStop: '吉塚',
    delay: 2,
    status: 'delayed',
    lastUpdated: new Date()
  },
  {
    id: 'train_002',
    type: 'train',
    line: 'JR鹿児島本線',
    operator: 'JR九州',
    currentPosition: { latitude: 33.5937, longitude: 130.3986 }, // 吉塚駅付近
    destination: '博多',
    nextStop: '箱崎',
    delay: 0,
    status: 'on_time',
    lastUpdated: new Date()
  },
  {
    id: 'bus_001',
    type: 'bus',
    line: '西鉄バス100番',
    operator: '西日本鉄道',
    currentPosition: { latitude: 33.5886, longitude: 130.4017 }, // 天神付近
    destination: '博多駅',
    nextStop: '福岡市役所前',
    delay: 3,
    status: 'delayed',
    lastUpdated: new Date()
  },
  {
    id: 'subway_001',
    type: 'subway',
    line: '福岡市地下鉄空港線',
    operator: '福岡市交通局',
    currentPosition: { latitude: 33.5904, longitude: 130.4138 }, // 博多駅付近
    destination: '福岡空港',
    nextStop: '東比恵',
    delay: 0,
    status: 'on_time',
    lastUpdated: new Date()
  }
];

export const sampleRoutes: TransportRoute[] = [
  {
    id: 'kagoshima_line',
    name: 'JR鹿児島本線',
    type: 'train',
    color: '#007FFF',
    stops: [
      { id: 'hakata', name: '博多', position: { latitude: 33.5904, longitude: 130.4017 }, type: 'station' },
      { id: 'yoshizuka', name: '吉塚', position: { latitude: 33.5937, longitude: 130.3986 }, type: 'station' },
      { id: 'hakozaki', name: '箱崎', position: { latitude: 33.5974, longitude: 130.3958 }, type: 'station' },
      { id: 'kashii', name: '香椎', position: { latitude: 33.6123, longitude: 130.3889 }, type: 'station' },
      { id: 'nishitobata', name: '西戸畑', position: { latitude: 33.8733, longitude: 130.8239 }, type: 'station' }
    ],
    path: [
      { latitude: 33.5904, longitude: 130.4017 },
      { latitude: 33.5937, longitude: 130.3986 },
      { latitude: 33.5974, longitude: 130.3958 },
      { latitude: 33.6123, longitude: 130.3889 },
      { latitude: 33.8733, longitude: 130.8239 }
    ]
  }
];

export const sampleDelays: DelayInfo[] = [
  {
    vehicleId: 'train_001',
    delayMinutes: 2,
    reason: '乗客混雑のため',
    affectedStops: ['博多', '吉塚', '箱崎'],
    estimatedResolution: new Date(Date.now() + 5 * 60 * 1000) // 5分後
  },
  {
    vehicleId: 'bus_001',
    delayMinutes: 3,
    reason: '交通渋滞のため',
    affectedStops: ['天神', '福岡市役所前'],
    estimatedResolution: new Date(Date.now() + 8 * 60 * 1000) // 8分後
  }
];

export const sampleTrafficData: TrafficData = {
  vehicles: sampleVehicles,
  routes: sampleRoutes,
  delays: sampleDelays,
  lastFetch: new Date()
};

// 福岡の主要駅座標
export const fukuokaStations = {
  hakata: { latitude: 33.5904, longitude: 130.4017 },
  tenjin: { latitude: 33.5886, longitude: 130.4017 },
  yoshizuka: { latitude: 33.5937, longitude: 130.3986 },
  hakozaki: { latitude: 33.5974, longitude: 130.3958 },
  kashii: { latitude: 33.6123, longitude: 130.3889 },
  nishijin: { latitude: 33.5755, longitude: 130.3669 },
  fukuokakuko: { latitude: 33.5859, longitude: 130.4508 }
};