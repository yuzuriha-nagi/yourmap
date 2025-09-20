import { NextResponse } from 'next/server';

export const maxDuration = 30;

// 列車種別を取得するヘルパー関数
function getTrainType(lineId: string, vehicleIndex: number, isRushHour: boolean): string {
  if (lineId === 'osaka_loop_line') return '普通';
  if (lineId === 'sanin_main_line') return vehicleIndex % 3 === 0 ? '特急' : '普通';
  if (lineId === 'tokaido_main_line_west') {
    if (isRushHour) return vehicleIndex % 2 === 0 ? '快速' : '普通';
    return vehicleIndex % 3 === 0 ? '新快速' : vehicleIndex % 2 === 0 ? '快速' : '普通';
  }
  if (lineId === 'sanyo_main_line') return vehicleIndex % 2 === 0 ? '快速' : '普通';
  return vehicleIndex % 3 === 0 ? '快速' : '普通';
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ODPT_API_KEY || process.env.ODPT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ODPT API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const vehicles: Record<string, unknown>[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // 西日本地域の主要路線の運行パターンをシミュレート
    const operatingLines = [
      // 関西エリア
      {
        id: 'tokaido_main_line_west',
        name: 'JR東海道本線(西)',
        operator: 'JR-West',
        type: 'train' as const,
        stations: ['大阪', '新大阪', '吹田', '茨木', '高槻', '山崎', '長岡京', '向日町', '京都'],
        headway: 6,
        operatingHours: { start: 5, end: 24 }
      },
      {
        id: 'osaka_loop_line',
        name: 'JR大阪環状線',
        operator: 'JR-West',
        type: 'train' as const,
        stations: ['大阪', '天満', '桜ノ宮', '京橋', '大阪城公園', '森ノ宮', '玉造', '鶴橋', '桃谷', '寺田町', '天王寺', '新今宮', '今宮', '芦原橋', '大正', '弁天町', '西九条', '野田', '福島', '大阪'],
        headway: 4,
        operatingHours: { start: 5, end: 24 }
      },
      {
        id: 'sanyo_main_line',
        name: 'JR山陽本線',
        operator: 'JR-West',
        type: 'train' as const,
        stations: ['神戸', '須磨', '舞子', '明石', '西明石', '加古川', '姫路', '相生', '岡山', '倉敷', '福山', '広島'],
        headway: 8,
        operatingHours: { start: 5, end: 24 }
      },
      // 北陸エリア
      {
        id: 'hokuriku_main_line',
        name: 'JR北陸本線',
        operator: 'JR-West',
        type: 'train' as const,
        stations: ['金沢', '津幡', '宇野気', '羽咋', '七尾', '小松', '加賀温泉', '芦原温泉', '福井'],
        headway: 12,
        operatingHours: { start: 5, end: 23 }
      },
      // 山陰エリア
      {
        id: 'sanin_main_line',
        name: 'JR山陰本線',
        operator: 'JR-West',
        type: 'train' as const,
        stations: ['京都', '亀岡', '園部', '福知山', '豊岡', '鳥取', '倉吉', '米子', '松江', '出雲市'],
        headway: 15,
        operatingHours: { start: 6, end: 22 }
      }
    ];

    // 実際の運行情報APIも試行
    const [trainInfoResponse] = await Promise.allSettled([
      fetch(`https://api.odpt.org/api/v4/odpt:TrainInformation?acl:consumerKey=${apiKey}&odpt:operator=odpt.Operator:JR-Kyushu,odpt.Operator:FukuokaSubway`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      })
    ]);

    clearTimeout(timeoutId);

    // 運行情報からの遅延データ
    const operationInfo: Record<string, unknown>[] = [];
    if (trainInfoResponse.status === 'fulfilled' && trainInfoResponse.value.ok) {
      const data = await trainInfoResponse.value.json();
      if (Array.isArray(data)) {
        operationInfo.push(...data);
      }
    }

    // 天候による遅延要素を追加
    const weatherDelayFactor = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : 0;
    const isHoliday = now.getDay() === 0 || now.getDay() === 6; // 土日

    // 現在運行中の車両を生成（時刻表ベース）
    operatingLines.forEach((line) => {
      const { start, end } = line.operatingHours;

      // 運行時間内かチェック
      if (currentHour < start || currentHour >= end) {
        return; // 運行時間外は車両なし
      }

      // 路線の遅延情報を取得
      const lineDelayInfo = operationInfo.find(info => {
        const railway = info['odpt:railway'] as string;
        const operator = info['odpt:operator'] as string;
        return railway?.includes(line.id) || operator?.includes(line.operator);
      });

      const baseDelay = (lineDelayInfo?.['odpt:delayMinutes'] as number) || 0;

      // 各方向の運行車両数を計算
      const totalStations = line.stations.length;
      const journeyTime = (totalStations - 1) * 3; // 駅間3分と仮定
      const vehiclesPerDirection = Math.ceil(journeyTime / line.headway);

      // 上り方向の車両
      for (let i = 0; i < vehiclesPerDirection; i++) {
        const progressRatio = (currentTimeMinutes % line.headway + i * line.headway) / journeyTime;
        const adjustedProgress = (progressRatio + i / vehiclesPerDirection) % 1;
        const stationIndex = Math.floor(adjustedProgress * (totalStations - 1));
        const currentStation = line.stations[stationIndex];
        const destination = line.stations[totalStations - 1];

        // より詳細な遅延要素を追加
        const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
        const rushDelayMultiplier = isRushHour && !isHoliday ? 1.5 : 1.0;
        const delayChance = isRushHour && !isHoliday ? 0.35 : 0.12;

        // 路線特有の遅延傾向
        const lineDelayFactor = line.id === 'osaka_loop_line' ? 1.2 : // 環状線は遅延しやすい
                               line.id === 'sanin_main_line' ? 0.8 : // 山陰本線は比較的定時
                               1.0;

        const randomDelay = Math.random() < delayChance ?
          Math.floor((Math.random() * 8 + 1) * lineDelayFactor * rushDelayMultiplier) : 0;
        const totalDelay = Math.min(baseDelay + randomDelay + weatherDelayFactor, 20); // 最大20分

        vehicles.push({
          id: `${line.id}_up_${i}_${Date.now()}`,
          type: line.type,
          line: line.name,
          operator: line.operator,
          trainNumber: `${line.id.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          trainType: getTrainType(line.id, i, isRushHour),
          currentStation: currentStation,
          destination: destination,
          delay: totalDelay,
          status: totalDelay > 0 ? 'delayed' : 'on_time',
          isEstimated: true,
          carComposition: line.type === 'train' ? 8 : 6,
          lastUpdated: new Date()
        });
      }

      // 下り方向の車両
      for (let i = 0; i < vehiclesPerDirection; i++) {
        const progressRatio = (currentTimeMinutes % line.headway + i * line.headway) / journeyTime;
        const adjustedProgress = (progressRatio + i / vehiclesPerDirection) % 1;
        const stationIndex = totalStations - 1 - Math.floor(adjustedProgress * (totalStations - 1));
        const currentStation = line.stations[stationIndex];
        const destination = line.stations[0];

        const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
        const rushDelayMultiplier = isRushHour && !isHoliday ? 1.5 : 1.0;
        const delayChance = isRushHour && !isHoliday ? 0.35 : 0.12;

        const lineDelayFactor = line.id === 'osaka_loop_line' ? 1.2 :
                               line.id === 'sanin_main_line' ? 0.8 :
                               1.0;

        const randomDelay = Math.random() < delayChance ?
          Math.floor((Math.random() * 8 + 1) * lineDelayFactor * rushDelayMultiplier) : 0;
        const totalDelay = Math.min(baseDelay + randomDelay + weatherDelayFactor, 20);

        vehicles.push({
          id: `${line.id}_down_${i}_${Date.now()}`,
          type: line.type,
          line: line.name,
          operator: line.operator,
          trainNumber: `${line.id.toUpperCase()}-${String(i + vehiclesPerDirection + 1).padStart(3, '0')}`,
          trainType: getTrainType(line.id, i + vehiclesPerDirection, isRushHour),
          currentStation: currentStation,
          destination: destination,
          delay: totalDelay,
          status: totalDelay > 0 ? 'delayed' : 'on_time',
          isEstimated: true,
          carComposition: line.type === 'train' ? 8 : 6,
          lastUpdated: new Date()
        });
      }
    });

    // 重複削除とソート
    const uniqueVehicles = vehicles.filter((vehicle, index, self) =>
      index === self.findIndex(v => v.id === vehicle.id)
    ).sort((a, b) => {
      const aLine = a.line as string;
      const bLine = b.line as string;
      return aLine.localeCompare(bLine);
    });

    return NextResponse.json({
      vehicles: uniqueVehicles,
      total: uniqueVehicles.length,
      realTime: vehicles.filter(v => !v.isEstimated).length,
      estimated: vehicles.filter(v => v.isEstimated).length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'API request timeout' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `API request failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown API error' },
      { status: 500 }
    );
  }
}