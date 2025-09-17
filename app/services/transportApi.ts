'use client';

import { TransportVehicle, DelayInfo } from '../types/transport';

// API設定
const API_CONFIG = {
  // 公共交通オープンデータ協議会
  odpt: {
    baseUrl: 'https://api.odpt.org/api/v4',
    apiKey: process.env.NEXT_PUBLIC_ODPT_API_KEY || '',
  },
  // Google Transit API (将来用)
  google: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  }
};

// リアルタイム運行情報のインターフェース
interface RealTimeOperationInfo {
  lineId: string;
  operatorId: string;
  delayMinutes?: number;
  status: 'normal' | 'delay' | 'suspended' | 'partial_suspension';
  informationText?: string;
}

class TransportApiService {

  /**
   * 公共交通オープンデータ協議会からリアルタイム運行情報を取得
   */
  async getRealtimeOperationInfo(): Promise<RealTimeOperationInfo[]> {
    // 開発モードまたはAPIキーがない場合はモックデータを使用
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !API_CONFIG.odpt.apiKey) {
      console.info('Using mock data for development');
      return this.getMockOperationInfo();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      const response = await fetch(
        `${API_CONFIG.odpt.baseUrl}/odpt:TrainInformation?acl:consumerKey=${API_CONFIG.odpt.apiKey}&odpt:operator=odpt.Operator:JR-Kyushu,odpt.Operator:Nishitetsu,odpt.Operator:FukuokaSubway`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key is invalid or expired');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        } else if (response.status >= 500) {
          throw new Error('API server error');
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format');
      }

      return this.parseOperationInfo(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('API request timeout');
        } else {
          console.error('Failed to fetch real-time operation info:', error.message);
        }
      }

      // エラー時はモックデータにフォールバック
      console.info('Falling back to mock data due to API error');
      return this.getMockOperationInfo();
    }
  }

  /**
   * GTFSリアルタイムデータから車両位置を推定
   */
  async getEstimatedVehiclePositions(): Promise<TransportVehicle[]> {
    // 現在は福岡地域のリアルタイム車両位置APIが限定的なため、
    // 運行情報と時刻表データから位置を推定
    const operationInfo = await this.getRealtimeOperationInfo();
    const vehicles = await this.estimateVehiclePositions(operationInfo);

    return vehicles;
  }

  /**
   * 運行情報から車両位置を推定
   */
  private async estimateVehiclePositions(operationInfo: RealTimeOperationInfo[]): Promise<TransportVehicle[]> {
    // 基本的な時刻表情報と運行状況から車両位置を推定
    // 実際の実装では、GTFS静的データと組み合わせて位置を計算

    const baseVehicles = await this.getBaseVehicleData();

    return baseVehicles.map(vehicle => {
      const lineInfo = operationInfo.find(info =>
        vehicle.line.includes(info.lineId) || vehicle.operator.includes(info.operatorId)
      );

      if (lineInfo) {
        return {
          ...vehicle,
          delay: lineInfo.delayMinutes || 0,
          status: this.mapStatusToVehicleStatus(lineInfo.status),
          lastUpdated: new Date()
        };
      }

      return vehicle;
    });
  }

  /**
   * 基本車両データを取得（時刻表ベース）
   */
  private async getBaseVehicleData(): Promise<TransportVehicle[]> {
    // 時刻表データから現在時刻で運行中の車両を推定
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 福岡地域の主要路線の基本スケジュール
    const scheduleBasedVehicles: TransportVehicle[] = [
      // JR鹿児島本線
      {
        id: `jr_train_${Date.now()}_1`,
        type: 'train',
        line: 'JR鹿児島本線',
        operator: 'JR九州',
        currentPosition: this.estimatePositionOnRoute('jr_kagoshima', currentHour, currentMinute),
        destination: '小倉',
        nextStop: this.getNextStopOnRoute('jr_kagoshima', currentHour, currentMinute),
        delay: 0,
        status: 'on_time',
        lastUpdated: new Date()
      },
      // 福岡市地下鉄空港線
      {
        id: `subway_${Date.now()}_1`,
        type: 'subway',
        line: '福岡市地下鉄空港線',
        operator: '福岡市交通局',
        currentPosition: this.estimatePositionOnRoute('fukuoka_airport', currentHour, currentMinute),
        destination: '福岡空港',
        nextStop: this.getNextStopOnRoute('fukuoka_airport', currentHour, currentMinute),
        delay: 0,
        status: 'on_time',
        lastUpdated: new Date()
      },
      // 西鉄バス
      {
        id: `bus_${Date.now()}_1`,
        type: 'bus',
        line: '西鉄バス100番',
        operator: '西日本鉄道',
        currentPosition: this.estimatePositionOnRoute('nishitetsu_bus', currentHour, currentMinute),
        destination: '博多駅',
        nextStop: this.getNextStopOnRoute('nishitetsu_bus', currentHour, currentMinute),
        delay: 0,
        status: 'on_time',
        lastUpdated: new Date()
      }
    ];

    return scheduleBasedVehicles;
  }

  /**
   * 路線上での位置を推定
   */
  private estimatePositionOnRoute(routeId: string, hour: number, minute: number): { latitude: number; longitude: number } {
    const routes = {
      jr_kagoshima: [
        { lat: 33.5904, lng: 130.4017 }, // 博多
        { lat: 33.5937, lng: 130.3986 }, // 吉塚
        { lat: 33.5974, lng: 130.3958 }, // 箱崎
      ],
      fukuoka_airport: [
        { lat: 33.5904, lng: 130.4017 }, // 博多
        { lat: 33.5904, lng: 130.4138 }, // 東比恵
        { lat: 33.5859, lng: 130.4508 }, // 福岡空港
      ],
      nishitetsu_bus: [
        { lat: 33.5886, lng: 130.4017 }, // 天神
        { lat: 33.5901, lng: 130.4021 }, // 福岡市役所前
        { lat: 33.5904, lng: 130.4017 }, // 博多駅
      ]
    };

    const route = routes[routeId as keyof typeof routes] || routes.jr_kagoshima;
    const progress = ((hour * 60 + minute) % 120) / 120; // 2時間周期で循環
    const segmentIndex = Math.floor(progress * (route.length - 1));
    const segmentProgress = (progress * (route.length - 1)) % 1;

    const startPoint = route[segmentIndex];
    const endPoint = route[Math.min(segmentIndex + 1, route.length - 1)];

    return {
      latitude: startPoint.lat + (endPoint.lat - startPoint.lat) * segmentProgress,
      longitude: startPoint.lng + (endPoint.lng - startPoint.lng) * segmentProgress
    };
  }

  /**
   * 次の停車駅を推定
   */
  private getNextStopOnRoute(routeId: string, hour: number, minute: number): string {
    const stops = {
      jr_kagoshima: ['博多', '吉塚', '箱崎', '香椎'],
      fukuoka_airport: ['博多', '東比恵', '福岡空港'],
      nishitetsu_bus: ['天神', '福岡市役所前', '博多駅']
    };

    const routeStops = stops[routeId as keyof typeof stops] || stops.jr_kagoshima;
    const progress = ((hour * 60 + minute) % 120) / 120;
    const nextStopIndex = Math.floor(progress * routeStops.length) + 1;

    return routeStops[nextStopIndex % routeStops.length];
  }

  /**
   * APIステータスを車両ステータスにマッピング
   */
  private mapStatusToVehicleStatus(status: string): 'on_time' | 'delayed' | 'cancelled' {
    switch (status) {
      case 'delay': return 'delayed';
      case 'suspended':
      case 'partial_suspension': return 'cancelled';
      default: return 'on_time';
    }
  }

  /**
   * 運行情報データをパース
   */
  private parseOperationInfo(data: unknown[]): RealTimeOperationInfo[] {
    return data.map(item => {
      const apiItem = item as Record<string, unknown>;
      return {
        lineId: (apiItem['odpt:railway'] as string) || (apiItem['odpt:busroute'] as string) || '',
        operatorId: (apiItem['odpt:operator'] as string) || '',
        delayMinutes: (apiItem['odpt:delayMinutes'] as number) || 0,
        status: this.parseOperationStatus(apiItem['odpt:trainInformationStatus'] as string),
        informationText: (apiItem['odpt:trainInformationText'] as string) || ''
      };
    });
  }

  /**
   * 運行状況をパース
   */
  private parseOperationStatus(status: string): 'normal' | 'delay' | 'suspended' | 'partial_suspension' {
    if (!status) return 'normal';
    if (status.includes('遅延') || status.includes('Delay')) return 'delay';
    if (status.includes('運転見合わせ') || status.includes('Suspended')) return 'suspended';
    if (status.includes('一部')) return 'partial_suspension';
    return 'normal';
  }

  /**
   * モック運行情報（APIキーがない場合）
   */
  private getMockOperationInfo(): RealTimeOperationInfo[] {
    const now = new Date();
    const hour = now.getHours();

    // 時間帯による遅延確率の調整（ラッシュ時は遅延が多い）
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const delayProbability = isRushHour ? 0.3 : 0.1;

    const mockData: RealTimeOperationInfo[] = [
      {
        lineId: 'jr_kagoshima',
        operatorId: 'jr_kyushu',
        delayMinutes: Math.random() < delayProbability ? Math.floor(Math.random() * 8) + 1 : 0,
        status: Math.random() < delayProbability ? 'delay' : 'normal',
        informationText: isRushHour && Math.random() < 0.2 ? '乗客混雑のため遅延' : undefined
      },
      {
        lineId: 'fukuoka_subway_airport',
        operatorId: 'fukuoka_city',
        delayMinutes: Math.random() < (delayProbability * 0.5) ? Math.floor(Math.random() * 4) + 1 : 0,
        status: Math.random() < (delayProbability * 0.5) ? 'delay' : 'normal',
        informationText: Math.random() < 0.1 ? '信号調整のため遅延' : undefined
      },
      {
        lineId: 'nishitetsu_bus',
        operatorId: 'nishitetsu',
        delayMinutes: Math.random() < (delayProbability * 1.5) ? Math.floor(Math.random() * 12) + 1 : 0,
        status: Math.random() < (delayProbability * 1.5) ? 'delay' : 'normal',
        informationText: isRushHour && Math.random() < 0.3 ? '交通渋滞のため遅延' : undefined
      }
    ];

    return mockData;
  }

  /**
   * 遅延情報を取得
   */
  async getDelayInfo(): Promise<DelayInfo[]> {
    const operationInfo = await this.getRealtimeOperationInfo();

    return operationInfo
      .filter(info => info.status === 'delay' || info.delayMinutes! > 0)
      .map(info => ({
        vehicleId: `${info.operatorId}_${info.lineId}`,
        delayMinutes: info.delayMinutes || 0,
        reason: info.informationText || '運行状況により遅延',
        affectedStops: this.getAffectedStops(info.lineId),
        estimatedResolution: new Date(Date.now() + (info.delayMinutes || 5) * 60 * 1000)
      }));
  }

  /**
   * 影響を受ける停車駅を取得
   */
  private getAffectedStops(lineId: string): string[] {
    const stopsMap = {
      jr_kagoshima: ['博多', '吉塚', '箱崎', '香椎'],
      fukuoka_subway_airport: ['博多', '祇園', '中洲川端', '天神', '赤坂', '大濠公園', '唐人町', '西新', '藤崎', '室見', '姪浜', '福岡空港'],
      nishitetsu_bus: ['天神', '福岡市役所前', '博多駅']
    };

    return stopsMap[lineId as keyof typeof stopsMap] || ['博多', '天神'];
  }
}

// シングルトンインスタンス
export const transportApiService = new TransportApiService();

// 型定義をエクスポート
export type { RealTimeOperationInfo };