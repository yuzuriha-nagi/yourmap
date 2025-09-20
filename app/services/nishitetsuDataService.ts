import { monitoringService, logInfo, logWarning, logError } from '../utils/monitoring';
import { validateVehicleData, sanitizeVehicleData, ValidatedVehicleResponse, ValidatedVehicle, generateFallbackVehicleData } from '../utils/dataValidation';
import { dataServiceConfig, DataServiceSettings } from '../config/dataService';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface DataServiceConfig {
  enabled: boolean;
  rateLimit: RateLimitConfig;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 元のNishitetsu API型定義は削除し、ValidatedVehicle型を使用

class NishitetsuDataService {
  private requestHistory: number[] = [];
  private cache: Map<string, { data: ValidatedVehicleResponse; timestamp: number }> = new Map();

  constructor() {
    // 設定変更リスナーを追加
    dataServiceConfig.addListener((settings: DataServiceSettings) => {
      logInfo('NishitetsuService', 'Configuration updated', {
        enabled: settings.nishitetsuService.enabled
      });
    });
  }

  private get config() {
    return dataServiceConfig.getNishitetsuSettings();
  }

  private get cacheTTL() {
    return this.config.cacheTTL;
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // 期限切れのリクエスト履歴を削除
    this.requestHistory = this.requestHistory.filter(timestamp => timestamp > windowStart);

    return this.requestHistory.length >= this.config.rateLimit.maxRequests;
  }

  private addRequestToHistory(): void {
    this.requestHistory.push(Date.now());
  }

  private getCacheKey(endpoint: string): string {
    return `nishitetsu_${endpoint}`;
  }

  private getFromCache(endpoint: string): ValidatedVehicleResponse | null {
    const cacheKey = this.getCacheKey(endpoint);
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }

    return null;
  }

  private setCache(endpoint: string, data: ValidatedVehicleResponse): void {
    const cacheKey = this.getCacheKey(endpoint);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'YourMap Railway Analytics/1.0 (+https://yourmap.vercel.app/)',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ja,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        console.warn(`Request failed, retrying in ${this.config.retryDelay}ms... (attempt ${attempt}/${this.config.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private transformNishitetsuData(rawData: any): ValidatedVehicle[] {
    // 実際のNishitetsu APIレスポンス構造に基づいてデータを変換
    // この部分は実際のAPIレスポンス形式に合わせて調整が必要
    if (!rawData || !Array.isArray(rawData.vehicles)) {
      return [];
    }

    return rawData.vehicles.map((vehicle: any) => {
      // データサニタイゼーションを適用
      const sanitized = sanitizeVehicleData({
        id: vehicle.id || `vehicle_${Math.random().toString(36).substring(2, 11)}`,
        line: vehicle.line || '西鉄天神大牟田線',
        operator: vehicle.operator || '西日本鉄道',
        destination: vehicle.destination || '不明',
        delay: vehicle.delay || 0,
        currentStation: vehicle.currentStation,
        trainNumber: vehicle.trainNumber,
        trainType: vehicle.trainType || '普通',
        lastUpdated: vehicle.lastUpdated || new Date().toISOString(),
        isEstimated: vehicle.isEstimated || true,
        type: 'train',
        position: vehicle.position
      });

      // 必須フィールドのデフォルト値設定
      return {
        id: sanitized.id || `vehicle_${Math.random().toString(36).substring(2, 11)}`,
        line: sanitized.line || '西鉄天神大牟田線',
        operator: sanitized.operator || '西日本鉄道',
        destination: sanitized.destination || '不明',
        delay: sanitized.delay || 0,
        currentStation: sanitized.currentStation,
        trainNumber: sanitized.trainNumber,
        trainType: sanitized.trainType || '普通',
        lastUpdated: sanitized.lastUpdated || new Date(),
        isEstimated: sanitized.isEstimated ?? true,
        type: sanitized.type || 'train' as const,
        position: sanitized.position
      } as ValidatedVehicle;
    }).filter(v => v.id && v.line && v.operator && v.destination !== undefined);
  }

  async fetchVehicleData(lineId: string = 'nishitetsu_tenjin_omuta_line'): Promise<ValidatedVehicleResponse> {
    const startTime = Date.now();

    if (!this.config.enabled) {
      logWarning('NishitetsuService', 'Service is disabled', { lineId });
      throw new Error('Nishitetsu data service is disabled');
    }

    // キャッシュをチェック
    const cached = this.getFromCache(lineId);
    if (cached) {
      logInfo('NishitetsuService', 'Data served from cache', { lineId });
      monitoringService.recordRequest(true, Date.now() - startTime, true);
      return cached;
    }

    // レート制限をチェック
    if (this.isRateLimited()) {
      logWarning('NishitetsuService', 'Rate limit exceeded', { lineId });
      monitoringService.recordRateLimitHit();
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    this.addRequestToHistory();
    logInfo('NishitetsuService', 'Fetching vehicle data', { lineId });

    try {
      // 実際のNishitetsu APIエンドポイント（要調査・更新）
      const apiUrl = `https://busnavi-railway.nnr.co.jp/api/vehicle-positions/${lineId}`;

      const response = await this.fetchWithRetry(apiUrl, {
        method: 'GET',
        headers: {
          'Referer': 'https://busnavi-railway.nnr.co.jp/',
          'Origin': 'https://busnavi-railway.nnr.co.jp'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      const vehicles = this.transformNishitetsuData(rawData);

      const result: ValidatedVehicleResponse = {
        vehicles,
        total: vehicles.length,
        realTime: vehicles.filter(v => !v.isEstimated).length,
        estimated: vehicles.filter(v => v.isEstimated).length,
        lastFetch: new Date().toISOString()
      };

      // データ検証
      try {
        const validatedResult = validateVehicleData(result);

        // キャッシュに保存
        this.setCache(lineId, validatedResult);

        const responseTime = Date.now() - startTime;
        logInfo('NishitetsuService', 'Data fetch successful', {
          lineId,
          vehicleCount: vehicles.length,
          responseTime
        });
        monitoringService.recordRequest(true, responseTime, false);

        return validatedResult;
      } catch (validationError) {
        logError('NishitetsuService', 'Data validation failed', {
          lineId,
          error: validationError instanceof Error ? validationError.message : 'Unknown validation error'
        });

        // 検証に失敗した場合もフォールバックデータを返す
        const fallbackData = generateFallbackVehicleData();
        monitoringService.recordRequest(false, Date.now() - startTime, false);
        return fallbackData;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      logError('NishitetsuService', 'Failed to fetch vehicle data', {
        lineId,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      monitoringService.recordRequest(false, responseTime, false);

      // フォールバック: 空のデータを返す
      return generateFallbackVehicleData();
    }
  }

  // サービス有効化
  enable(): void {
    dataServiceConfig.enableNishitetsuService();
    logInfo('NishitetsuService', 'Service enabled');
  }

  // サービス無効化
  disable(): void {
    dataServiceConfig.disableNishitetsuService();
    logWarning('NishitetsuService', 'Service disabled');
  }

  // 統計情報取得
  getStats() {
    return {
      isEnabled: this.config.enabled,
      requestsInWindow: this.requestHistory.length,
      maxRequests: this.config.rateLimit.maxRequests,
      cacheSize: this.cache.size,
      lastRequestTime: this.requestHistory[this.requestHistory.length - 1] || null
    };
  }

  // キャッシュクリア
  clearCache(): void {
    this.cache.clear();
  }
}

// シングルトンインスタンス
export const nishitetsuService = new NishitetsuDataService();

export default NishitetsuDataService;