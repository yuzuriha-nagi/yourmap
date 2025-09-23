// 鉄道路線の幾何学的計算ユーティリティ

export interface StationPosition {
  name: string;
  latitude: number;
  longitude: number;
  index: number; // 路線上での順序
}

export interface RailwaySegment {
  fromStation: StationPosition;
  toStation: StationPosition;
  distance: number; // km
  coordinates: [number, number][]; // [lat, lng] の配列
}

export interface VehiclePosition {
  vehicleId: string;
  latitude: number;
  longitude: number;
  segmentIndex: number; // どの区間にいるか
  progress: number; // 区間内での進行度 (0-1)
  direction: 'up' | 'down'; // 上り・下り
}

// 2点間の距離計算（ハーバサイン公式）
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 2点間の中間点計算
export function calculateMidpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): [number, number] {
  return [
    (lat1 + lat2) / 2,
    (lon1 + lon2) / 2
  ];
}

// 線形補間による位置計算
export function interpolatePosition(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  progress: number // 0-1
): [number, number] {
  const lat = lat1 + (lat2 - lat1) * progress;
  const lng = lon1 + (lon2 - lon1) * progress;
  return [lat, lng];
}

// 駅間の線路セグメントを生成
export function createRailwaySegments(stations: StationPosition[]): RailwaySegment[] {
  const segments: RailwaySegment[] = [];

  for (let i = 0; i < stations.length - 1; i++) {
    const fromStation = stations[i];
    const toStation = stations[i + 1];

    const distance = calculateDistance(
      fromStation.latitude,
      fromStation.longitude,
      toStation.latitude,
      toStation.longitude
    );

    // 直線の座標を生成（開始点と終了点）
    const coordinates: [number, number][] = [
      [fromStation.latitude, fromStation.longitude],
      [toStation.latitude, toStation.longitude]
    ];

    segments.push({
      fromStation,
      toStation,
      distance,
      coordinates
    });
  }

  return segments;
}

// 車両の現在位置を計算
export function calculateVehiclePosition(
  segments: RailwaySegment[],
  vehicleId: string,
  currentStation: string,
  destination: string,
  progress: number = 0.5 // デフォルトは区間の中間点
): VehiclePosition | null {
  // 現在駅と目的地から方向を判定
  const currentStationIndex = segments.findIndex(seg =>
    seg.fromStation.name === currentStation || seg.toStation.name === currentStation
  );

  if (currentStationIndex === -1) {
    return null;
  }

  const segment = segments[currentStationIndex];
  const isUpDirection = segment.toStation.name === destination ||
    segments.some((seg, idx) => idx > currentStationIndex && seg.toStation.name === destination);

  // 位置を補間計算
  const [lat, lng] = interpolatePosition(
    segment.fromStation.latitude,
    segment.fromStation.longitude,
    segment.toStation.latitude,
    segment.toStation.longitude,
    progress
  );

  return {
    vehicleId,
    latitude: lat,
    longitude: lng,
    segmentIndex: currentStationIndex,
    progress,
    direction: isUpDirection ? 'up' : 'down'
  };
}

// 時刻表ベースの車両位置シミュレーション
export function simulateVehiclePositions(
  segments: RailwaySegment[],
  vehicles: any[]
): VehiclePosition[] {
  const positions: VehiclePosition[] = [];

  vehicles.forEach(vehicle => {
    if (!vehicle.currentStation) return;

    // 車両の進行状況をシミュレート
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // 分と秒を使って0-1の進行度を計算
    const timeProgress = (minutes % 5) / 5 + seconds / (5 * 60);
    const progress = Math.min(Math.max(timeProgress, 0), 1);

    const position = calculateVehiclePosition(
      segments,
      vehicle.id,
      vehicle.currentStation,
      vehicle.destination,
      progress
    );

    if (position) {
      positions.push(position);
    }
  });

  return positions;
}

// 西鉄天神大牟田線の駅座標データ（正確な位置情報に基づく）
export const NISHITETSU_STATIONS: StationPosition[] = [
  { name: '西鉄福岡（天神）', latitude: 33.5886887, longitude: 130.3999665, index: 0 },
  { name: '薬院', latitude: 33.58195, longitude: 130.401685, index: 1 },
  { name: '西鉄平尾', latitude: 33.573595, longitude: 130.406279, index: 2 },
  { name: '高宮', latitude: 33.566849, longitude: 130.414982, index: 3 },
  { name: '大橋', latitude: 33.559092, longitude: 130.426528, index: 4 },
  { name: '井尻', latitude: 33.551899, longitude: 130.44348, index: 5 },
  { name: '雑餉隈', latitude: 33.547236, longitude: 130.462809, index: 6 },
  { name: '桜並木', latitude: 33.5447306, longitude: 130.4664389, index: 7 },
  { name: '春日原', latitude: 33.537968, longitude: 130.473191, index: 8 },
  { name: '白木原', latitude: 33.52857145, longitude: 130.48271802, index: 9 },
  { name: '下大利', latitude: 33.5221472, longitude: 130.4894361, index: 10 },
  { name: '都府楼前', latitude: 33.5118972, longitude: 130.5076139, index: 11 },
  { name: '西鉄二日市', latitude: 33.50196388888889, longitude: 130.51763611111113, index: 12 },
  { name: '紫', latitude: 33.4964472, longitude: 130.5219861, index: 13 },
  { name: '朝倉街道', latitude: 33.4842111, longitude: 130.5325056, index: 14 },
  { name: '桜台', latitude: 33.471722, longitude: 130.5421639, index: 15 },
  { name: '筑紫', latitude: 33.462833, longitude: 130.5530972, index: 16 },
  { name: '津古', latitude: 33.4459083, longitude: 130.5654917, index: 17 },
  { name: '三国が丘', latitude: 33.4366000, longitude: 130.5631528, index: 18 },
  { name: '三沢', latitude: 33.4235583, longitude: 130.5605250, index: 19 },
  { name: '大保', latitude: 33.4118389, longitude: 130.5581639, index: 20 },
  { name: '西鉄小郡', latitude: 33.3963972, longitude: 130.5534667, index: 21 },
  { name: '端間', latitude: 33.3780611, longitude: 130.5507306, index: 22 },
  { name: '味坂', latitude: 33.353500, longitude: 130.540869, index: 23 },
  { name: '宮の陣', latitude: 33.3288472, longitude: 130.5305639, index: 24 },
  { name: '櫛原', latitude: 33.3199417, longitude: 130.5243361, index: 25 },
  { name: '西鉄久留米', latitude: 33.3123694, longitude: 130.5210917, index: 26 },
  { name: '花畑', latitude: 33.306083, longitude: 130.515306, index: 27 },
  { name: '聖マリア病院前', latitude: 33.3021, longitude: 130.5102, index: 28 },
  { name: '津福', latitude: 33.297250, longitude: 130.49833, index: 29 },
  { name: '安武', latitude: 33.2860472, longitude: 130.4886333, index: 30 },
  { name: '大善寺', latitude: 33.2712028, longitude: 130.474417, index: 31 },
  { name: '三潴', latitude: 33.2567472, longitude: 130.4695667, index: 32 },
  { name: '犬塚', latitude: 33.2473917, longitude: 130.4629250, index: 33 },
  { name: '大溝', latitude: 33.2270222, longitude: 130.4497917, index: 34 },
  { name: '八丁牟田', latitude: 33.2093389, longitude: 130.4378000, index: 35 },
  { name: '蒲池', latitude: 33.1893917, longitude: 130.4223278, index: 36 },
  { name: '矢加部', latitude: 33.1740361, longitude: 130.4156750, index: 37 },
  { name: '西鉄柳川', latitude: 33.164972, longitude: 130.4189944, index: 38 },
  { name: '徳益', latitude: 33.1550944, longitude: 130.4268722, index: 39 },
  { name: '塩塚', latitude: 33.1434028, longitude: 130.4311722, index: 40 },
  { name: '西鉄中島', latitude: 33.1227139, longitude: 130.4400083, index: 41 },
  { name: '江の浦', latitude: 33.1097333, longitude: 130.4464250, index: 42 },
  { name: '開', latitude: 33.0977083, longitude: 130.4526472, index: 43 },
  { name: '西鉄渡瀬', latitude: 33.08722, longitude: 130.458639, index: 44 },
  { name: '倉永', latitude: 33.0724917, longitude: 130.4638361, index: 45 },
  { name: '東甘木', latitude: 33.061806, longitude: 130.463861, index: 46 },
  { name: '西鉄銀水', latitude: 33.051722, longitude: 130.458472, index: 47 },
  { name: '新栄町', latitude: 33.0384556, longitude: 130.4496000, index: 48 },
  { name: '大牟田', latitude: 33.0296778, longitude: 130.4441083, index: 49 }
];

// 西鉄天神大牟田線のセグメントを生成
export const NISHITETSU_SEGMENTS = createRailwaySegments(NISHITETSU_STATIONS);