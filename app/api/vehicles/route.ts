import { NextResponse } from 'next/server';

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

    // 福岡地域の主要路線の運行パターンをシミュレート
    const operatingLines = [
      {
        id: 'kagoshima_main_line',
        name: 'JR鹿児島本線',
        operator: 'JR-Kyushu',
        type: 'train' as const,
        stations: ['博多', '吉塚', '箱崎', '香椎', '千早', '新宮中央', '福工大前', '九産大前', '篠栗', '城戸南蔵院前'],
        headway: 8, // 8分間隔
        operatingHours: { start: 5, end: 24 }
      },
      {
        id: 'hakata_minami_line',
        name: 'JR博多南線',
        operator: 'JR-Kyushu',
        type: 'train' as const,
        stations: ['博多', '博多南'],
        headway: 15,
        operatingHours: { start: 6, end: 23 }
      },
      {
        id: 'fukuoka_subway_airport',
        name: '福岡市地下鉄空港線',
        operator: 'FukuokaSubway',
        type: 'subway' as const,
        stations: ['姪浜', '室見', '藤崎', '西新', '唐人町', '大濠公園', '赤坂', '天神', '中洲川端', '祇園', '博多', '東比恵', '福岡空港'],
        headway: 4,
        operatingHours: { start: 5, end: 24 }
      },
      {
        id: 'fukuoka_subway_hakozaki',
        name: '福岡市地下鉄箱崎線',
        operator: 'FukuokaSubway',
        type: 'subway' as const,
        stations: ['中洲川端', '呉服町', '千代県庁口', '馬出九大病院前', '箱崎九大前', '箱崎宮前', '貝塚'],
        headway: 6,
        operatingHours: { start: 5, end: 24 }
      },
      {
        id: 'fukuoka_subway_nanakuma',
        name: '福岡市地下鉄七隈線',
        operator: 'FukuokaSubway',
        type: 'subway' as const,
        stations: ['橋本', '次郎丸', '賀茂', '野芥', '梅林', '福大前', '七隈', '金山', '茶山', '別府', '六本松', '桜坂', '薬院大通', '薬院', '渡辺通', '天神南', '博多'],
        headway: 5,
        operatingHours: { start: 5, end: 24 }
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

    // 現在運行中の車両を生成（時刻表ベース）
    operatingLines.forEach((line) => {
      const { start, end } = line.operatingHours;

      // 運行時間内かチェック
      if (currentHour < start || currentHour >= end) {
        return;
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

        // ランダムな遅延要素を追加（ラッシュ時は遅延しやすい）
        const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
        const delayChance = isRushHour ? 0.3 : 0.1;
        const randomDelay = Math.random() < delayChance ? Math.floor(Math.random() * 5) + 1 : 0;
        const totalDelay = baseDelay + randomDelay;

        vehicles.push({
          id: `${line.id}_up_${i}_${Date.now()}`,
          type: line.type,
          line: line.name,
          operator: line.operator,
          trainNumber: `${line.id.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          trainType: line.type === 'subway' ? '普通' : '快速',
          currentStation: currentStation,
          destination: destination,
          delay: totalDelay,
          status: totalDelay > 0 ? 'delayed' : 'on_time',
          isEstimated: true,
          carComposition: line.type === 'subway' ? 6 : 8,
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
        const delayChance = isRushHour ? 0.3 : 0.1;
        const randomDelay = Math.random() < delayChance ? Math.floor(Math.random() * 5) + 1 : 0;
        const totalDelay = baseDelay + randomDelay;

        vehicles.push({
          id: `${line.id}_down_${i}_${Date.now()}`,
          type: line.type,
          line: line.name,
          operator: line.operator,
          trainNumber: `${line.id.toUpperCase()}-${String(i + vehiclesPerDirection + 1).padStart(3, '0')}`,
          trainType: line.type === 'subway' ? '普通' : '快速',
          currentStation: currentStation,
          destination: destination,
          delay: totalDelay,
          status: totalDelay > 0 ? 'delayed' : 'on_time',
          isEstimated: true,
          carComposition: line.type === 'subway' ? 6 : 8,
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