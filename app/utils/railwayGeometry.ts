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

// 西鉄天神大牟田線の駅座標データ
export const NISHITETSU_STATIONS: StationPosition[] = [
  { name: '西鉄福岡（天神）', latitude: 33.590783, longitude: 130.399239, index: 0 },
  { name: '薬院', latitude: 33.579444, longitude: 130.398611, index: 1 },
  { name: '西鉄平尾', latitude: 33.569722, longitude: 130.400833, index: 2 },
  { name: '高宮', latitude: 33.561389, longitude: 130.403889, index: 3 },
  { name: '大橋', latitude: 33.547500, longitude: 130.408889, index: 4 },
  { name: '井尻', latitude: 33.536944, longitude: 130.413333, index: 5 },
  { name: '春日原', latitude: 33.525278, longitude: 130.418056, index: 6 },
  { name: '白水', latitude: 33.516944, longitude: 130.421111, index: 7 },
  { name: '下大利', latitude: 33.507778, longitude: 130.424722, index: 8 },
  { name: '都府楼前', latitude: 33.497500, longitude: 130.428889, index: 9 },
  { name: '二日市', latitude: 33.486111, longitude: 130.433333, index: 10 },
  { name: '朝倉街道', latitude: 33.472778, longitude: 130.439167, index: 11 },
  { name: '桜台', latitude: 33.463889, longitude: 130.442500, index: 12 },
  { name: '筑紫', latitude: 33.454444, longitude: 130.446111, index: 13 },
  { name: '津古', latitude: 33.444167, longitude: 130.450278, index: 14 },
  { name: '三国が丘', latitude: 33.434722, longitude: 130.454167, index: 15 },
  { name: '三沢', latitude: 33.426111, longitude: 130.457500, index: 16 },
  { name: '大保', latitude: 33.418333, longitude: 130.460556, index: 17 },
  { name: '西鉄小郡', latitude: 33.405833, longitude: 130.465833, index: 18 },
  { name: '端間', latitude: 33.395278, longitude: 130.469722, index: 19 },
  { name: '味坂', latitude: 33.385556, longitude: 130.473333, index: 20 },
  { name: '宮の陣', latitude: 33.372500, longitude: 130.478889, index: 21 },
  { name: '櫛原', latitude: 33.362778, longitude: 130.482500, index: 22 },
  { name: '西鉄久留米', latitude: 33.352222, longitude: 130.486111, index: 23 },
  { name: '花畑', latitude: 33.342500, longitude: 130.489444, index: 24 },
  { name: '試験場前', latitude: 33.333611, longitude: 130.492222, index: 25 },
  { name: '津福', latitude: 33.325278, longitude: 130.494722, index: 26 },
  { name: '安武', latitude: 33.316667, longitude: 130.497222, index: 27 },
  { name: '大善寺', latitude: 33.306944, longitude: 130.500278, index: 28 },
  { name: '三潴', latitude: 33.296944, longitude: 130.503611, index: 29 },
  { name: '犬塚', latitude: 33.287222, longitude: 130.506944, index: 30 },
  { name: '大溝', latitude: 33.277500, longitude: 130.510278, index: 31 },
  { name: '八丁牟田', latitude: 33.267778, longitude: 130.513611, index: 32 },
  { name: '蒲池', latitude: 33.258056, longitude: 130.516944, index: 33 },
  { name: '矢加部', latitude: 33.248333, longitude: 130.520278, index: 34 },
  { name: '塩塚', latitude: 33.238611, longitude: 130.523611, index: 35 },
  { name: '西鉄銀水', latitude: 33.228889, longitude: 130.526944, index: 36 },
  { name: '新栄町', latitude: 33.219167, longitude: 130.530278, index: 37 },
  { name: '西鉄柳川', latitude: 33.209444, longitude: 130.533611, index: 38 },
  { name: '徳益', latitude: 33.199722, longitude: 130.536944, index: 39 },
  { name: '沖端', latitude: 33.190000, longitude: 130.540278, index: 40 },
  { name: '西鉄中島', latitude: 33.180278, longitude: 130.543611, index: 41 },
  { name: '江の浦', latitude: 33.170556, longitude: 130.546944, index: 42 },
  { name: '開', latitude: 33.160833, longitude: 130.550278, index: 43 },
  { name: '倉永', latitude: 33.151111, longitude: 130.553611, index: 44 },
  { name: '東甘木', latitude: 33.141389, longitude: 130.556944, index: 45 },
  { name: '西鉄渡瀬', latitude: 33.131667, longitude: 130.560278, index: 46 },
  { name: '吉野', latitude: 33.121944, longitude: 130.563611, index: 47 },
  { name: '銀水', latitude: 33.112222, longitude: 130.566944, index: 48 },
  { name: '新大牟田', latitude: 33.102500, longitude: 130.570278, index: 49 },
  { name: '大牟田', latitude: 33.092778, longitude: 130.573611, index: 50 }
];

// 西鉄天神大牟田線のセグメントを生成
export const NISHITETSU_SEGMENTS = createRailwaySegments(NISHITETSU_STATIONS);