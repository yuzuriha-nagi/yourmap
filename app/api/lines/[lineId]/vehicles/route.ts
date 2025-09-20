import { NextRequest, NextResponse } from 'next/server';
import { nishitetsuService } from '../../../../services/nishitetsuDataService';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { lineId: string } }
) {
  const { lineId } = params;

  // 西鉄天神大牟田線の場合は新しいサービスを使用
  if (lineId === 'nishitetsu_tenjin_omuta_line') {
    try {
      // 基本的な検証
      if (!lineId || typeof lineId !== 'string') {
        return NextResponse.json(
          { error: 'Invalid line ID' },
          { status: 400 }
        );
      }

      // サービスが無効の場合はフォールバックデータを返す
      if (!nishitetsuService.getStats().isEnabled) {
        console.log('Nishitetsu service is disabled, using fallback data');
        // 既存のシミュレーションロジックにフォールバック
      } else {
        try {
          // 実際のデータを取得
          const vehicleData = await nishitetsuService.fetchVehicleData(lineId);

          return NextResponse.json({
            ...vehicleData,
            source: 'nishitetsu',
            lineId,
            lineName: '西鉄天神大牟田線'
          });
        } catch (serviceError) {
          console.error('Nishitetsu service error:', serviceError);
          // サービスエラーの場合は既存のシミュレーションにフォールバック
        }
      }
    } catch (error) {
      console.error('Nishitetsu integration error:', error);
      // エラーの場合は既存のシミュレーションにフォールバック
    }
  }

  // 路線ごとの設定
  const lineConfigs: Record<string, {
    name: string;
    operator: string;
    type: 'train' | 'subway' | 'bus';
    stations: string[];
    headway: number;
    operatingHours: { start: number; end: number };
  }> = {
    nishitetsu_tenjin_omuta_line: {
      name: '西鉄天神大牟田線',
      operator: '西日本鉄道',
      type: 'train',
      stations: ['西鉄福岡（天神）', '薬院', '西鉄平尾', '高宮', '大橋', '井尻', '春日原', '白水', '下大利', '都府楼前', '二日市', '朝倉街道', '桜台', '筑紫', '津古', '三国が丘', '三沢', '大保', '西鉄小郡', '端間', '味坂', '宮の陣', '櫛原', '西鉄久留米', '花畑', '試験場前', '津福', '安武', '大善寺', '三潴', '犬塚', '大溝', '八丁牟田', '蒲池', '矢加部', '塩塚', '西鉄銀水', '新栄町', '西鉄柳川', '徳益', '沖端', '西鉄中島', '江の浦', '開', '倉永', '東甘木', '西鉄渡瀬', '吉野', '銀水', '新大牟田', '大牟田'],
      headway: 8,
      operatingHours: { start: 5, end: 24 }
    },
    tokaido_main_line_west: {
      name: 'JR東海道本線(西)',
      operator: 'JR-West',
      type: 'train',
      stations: ['大阪', '新大阪', '吹田', '茨木', '高槻', '山崎', '長岡京', '向日町', '京都'],
      headway: 6,
      operatingHours: { start: 5, end: 24 }
    },
    osaka_loop_line: {
      name: 'JR大阪環状線',
      operator: 'JR-West',
      type: 'train',
      stations: ['大阪', '天満', '桜ノ宮', '京橋', '大阪城公園', '森ノ宮', '玉造', '鶴橋', '桃谷', '寺田町', '天王寺', '新今宮', '今宮', '芦原橋', '大正', '弁天町', '西九条', '野田', '福島'],
      headway: 4,
      operatingHours: { start: 5, end: 24 }
    },
    sanyo_main_line: {
      name: 'JR山陽本線',
      operator: 'JR-West',
      type: 'train',
      stations: ['神戸', '須磨', '舞子', '明石', '西明石', '加古川', '姫路', '相生', '岡山', '倉敷', '福山', '広島'],
      headway: 8,
      operatingHours: { start: 5, end: 24 }
    },
    hokuriku_main_line: {
      name: 'JR北陸本線',
      operator: 'JR-West',
      type: 'train',
      stations: ['金沢', '津幡', '宇野気', '羽咋', '七尾', '小松', '加賀温泉', '芦原温泉', '福井'],
      headway: 12,
      operatingHours: { start: 5, end: 23 }
    },
    sanin_main_line: {
      name: 'JR山陰本線',
      operator: 'JR-West',
      type: 'train',
      stations: ['京都', '亀岡', '園部', '福知山', '豊岡', '鳥取', '倉吉', '米子', '松江', '出雲市'],
      headway: 15,
      operatingHours: { start: 6, end: 22 }
    }
  };

  const lineConfig = lineConfigs[lineId];

  if (!lineConfig) {
    return NextResponse.json(
      { error: 'Line not found' },
      { status: 404 }
    );
  }

  try {
    const vehicles: Record<string, unknown>[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // 天候による遅延要素と土日祝日チェック
    const weatherDelayFactor = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : 0;
    const isHoliday = now.getDay() === 0 || now.getDay() === 6;

    // 運行時間チェック
    const { start, end } = lineConfig.operatingHours;
    if (currentHour < start || currentHour >= end) {
      return NextResponse.json({
        lineId,
        lineName: lineConfig.name,
        vehicles: [],
        total: 0,
        realTime: 0,
        estimated: 0,
        lastUpdated: new Date().toISOString(),
        message: `運行時間外です（${start}:00-${end}:00）`
      });
    }

    const totalStations = lineConfig.stations.length;
    const journeyTime = (totalStations - 1) * 3; // 駅間3分と仮定
    const vehiclesPerDirection = Math.ceil(journeyTime / lineConfig.headway);

    // 上り方向の車両
    for (let i = 0; i < vehiclesPerDirection; i++) {
      const progressRatio = (currentTimeMinutes % lineConfig.headway + i * lineConfig.headway) / journeyTime;
      const adjustedProgress = (progressRatio + i / vehiclesPerDirection) % 1;
      const stationIndex = Math.floor(adjustedProgress * (totalStations - 1));
      const currentStation = lineConfig.stations[stationIndex];
      const destination = lineConfig.stations[totalStations - 1];

      // より詳細な遅延要素を追加
      const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      const rushDelayMultiplier = isRushHour && !isHoliday ? 1.5 : 1.0;
      const delayChance = isRushHour && !isHoliday ? 0.35 : 0.12;

      // 路線特有の遅延傾向
      const lineDelayFactor = lineId === 'osaka_loop_line' ? 1.2 :
                             lineId === 'sanin_main_line' ? 0.8 :
                             1.0;

      const randomDelay = Math.random() < delayChance ?
        Math.floor((Math.random() * 8 + 1) * lineDelayFactor * rushDelayMultiplier) : 0;
      const totalDelay = Math.min(randomDelay + weatherDelayFactor, 20);

      vehicles.push({
        id: `${lineId}_up_${i}_${Date.now()}`,
        type: lineConfig.type,
        line: lineConfig.name,
        operator: lineConfig.operator,
        trainNumber: `${lineId.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        trainType: getTrainType(lineId, i, isRushHour),
        currentStation: currentStation,
        destination: destination,
        delay: totalDelay,
        status: totalDelay > 0 ? 'delayed' : 'on_time',
        direction: 'up',
        isEstimated: true,
        carComposition: lineConfig.type === 'train' ? 8 : 6,
        lastUpdated: new Date()
      });
    }

    // 下り方向の車両（環状線の場合は片方向のみ）
    if (lineId !== 'osaka_loop_line') {
      for (let i = 0; i < vehiclesPerDirection; i++) {
        const progressRatio = (currentTimeMinutes % lineConfig.headway + i * lineConfig.headway) / journeyTime;
        const adjustedProgress = (progressRatio + i / vehiclesPerDirection) % 1;
        const stationIndex = totalStations - 1 - Math.floor(adjustedProgress * (totalStations - 1));
        const currentStation = lineConfig.stations[stationIndex];
        const destination = lineConfig.stations[0];

        const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
        const rushDelayMultiplier = isRushHour && !isHoliday ? 1.5 : 1.0;
        const delayChance = isRushHour && !isHoliday ? 0.35 : 0.12;

        const lineDelayFactor = lineId === 'osaka_loop_line' ? 1.2 :
                               lineId === 'sanin_main_line' ? 0.8 :
                               1.0;

        const randomDelay = Math.random() < delayChance ?
          Math.floor((Math.random() * 8 + 1) * lineDelayFactor * rushDelayMultiplier) : 0;
        const totalDelay = Math.min(randomDelay + weatherDelayFactor, 20);

        vehicles.push({
          id: `${lineId}_down_${i}_${Date.now()}`,
          type: lineConfig.type,
          line: lineConfig.name,
          operator: lineConfig.operator,
          trainNumber: `${lineId.toUpperCase()}-${String(i + vehiclesPerDirection + 1).padStart(3, '0')}`,
          trainType: getTrainType(lineId, i + vehiclesPerDirection, isRushHour),
          currentStation: currentStation,
          destination: destination,
          delay: totalDelay,
          status: totalDelay > 0 ? 'delayed' : 'on_time',
          direction: 'down',
          isEstimated: true,
          carComposition: lineConfig.type === 'train' ? 8 : 6,
          lastUpdated: new Date()
        });
      }
    }

    return NextResponse.json({
      lineId,
      lineName: lineConfig.name,
      vehicles: vehicles,
      total: vehicles.length,
      realTime: 0,
      estimated: vehicles.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating line vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to generate vehicle data' },
      { status: 500 }
    );
  }
}