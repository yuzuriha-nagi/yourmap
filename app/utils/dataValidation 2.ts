import { z } from 'zod';

// 車両データのスキーマ定義
export const VehicleSchema = z.object({
  id: z.string().min(1),
  line: z.string().min(1),
  operator: z.string().min(1),
  destination: z.string().min(1),
  delay: z.number().min(0).max(999), // 最大999分の遅延まで許可
  currentStation: z.string().optional(),
  trainNumber: z.string().optional(),
  trainType: z.string().optional(),
  lastUpdated: z.union([z.string(), z.date()]),
  isEstimated: z.boolean(),
  type: z.enum(['train', 'subway', 'bus']),
  position: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

// API レスポンスのスキーマ定義
export const VehicleResponseSchema = z.object({
  vehicles: z.array(VehicleSchema),
  total: z.number().min(0),
  realTime: z.number().min(0),
  estimated: z.number().min(0),
  lastFetch: z.union([z.string(), z.date()])
});

// Nishitetsu APIレスポンスの型
export type ValidatedVehicle = z.infer<typeof VehicleSchema>;
export type ValidatedVehicleResponse = z.infer<typeof VehicleResponseSchema>;

// データ検証関数
export function validateVehicleData(data: unknown): ValidatedVehicleResponse {
  try {
    return VehicleResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Vehicle data validation failed:', error.errors);
      throw new Error(`Data validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// 個別車両データの検証
export function validateSingleVehicle(data: unknown): ValidatedVehicle {
  try {
    return VehicleSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Single vehicle validation failed:', error.errors);
      throw new Error(`Vehicle validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// データサニタイゼーション関数
export function sanitizeVehicleData(data: any): Partial<ValidatedVehicle> {
  const sanitized: any = {};

  // 必須フィールドの処理
  if (typeof data.id === 'string' && data.id.trim()) {
    sanitized.id = data.id.trim().substring(0, 100); // 最大100文字
  }

  if (typeof data.line === 'string' && data.line.trim()) {
    sanitized.line = data.line.trim().substring(0, 100);
  }

  if (typeof data.operator === 'string' && data.operator.trim()) {
    sanitized.operator = data.operator.trim().substring(0, 100);
  }

  if (typeof data.destination === 'string' && data.destination.trim()) {
    sanitized.destination = data.destination.trim().substring(0, 100);
  }

  // 数値フィールドの処理
  if (typeof data.delay === 'number' && !isNaN(data.delay)) {
    sanitized.delay = Math.max(0, Math.min(999, Math.floor(data.delay)));
  } else if (typeof data.delay === 'string') {
    const parsed = parseInt(data.delay, 10);
    if (!isNaN(parsed)) {
      sanitized.delay = Math.max(0, Math.min(999, parsed));
    }
  }

  // オプションフィールドの処理
  if (typeof data.currentStation === 'string' && data.currentStation.trim()) {
    sanitized.currentStation = data.currentStation.trim().substring(0, 100);
  }

  if (typeof data.trainNumber === 'string' && data.trainNumber.trim()) {
    sanitized.trainNumber = data.trainNumber.trim().substring(0, 50);
  }

  if (typeof data.trainType === 'string' && data.trainType.trim()) {
    sanitized.trainType = data.trainType.trim().substring(0, 50);
  }

  // 日時の処理
  if (data.lastUpdated) {
    if (data.lastUpdated instanceof Date) {
      sanitized.lastUpdated = data.lastUpdated.toISOString();
    } else if (typeof data.lastUpdated === 'string') {
      try {
        sanitized.lastUpdated = new Date(data.lastUpdated).toISOString();
      } catch {
        sanitized.lastUpdated = new Date().toISOString();
      }
    }
  }

  // ブール値の処理
  sanitized.isEstimated = Boolean(data.isEstimated);

  // 車両タイプの処理
  if (['train', 'subway', 'bus'].includes(data.type)) {
    sanitized.type = data.type;
  }

  // 位置情報の処理
  if (data.position && typeof data.position === 'object') {
    const lat = parseFloat(data.position.latitude);
    const lng = parseFloat(data.position.longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      sanitized.position = {
        latitude: lat,
        longitude: lng
      };
    }
  }

  return sanitized;
}

// フォールバックデータ生成
export function generateFallbackVehicleData(lineId: string, lineName: string): ValidatedVehicleResponse {
  return {
    vehicles: [],
    total: 0,
    realTime: 0,
    estimated: 0,
    lastFetch: new Date().toISOString()
  };
}

// データ整合性チェック
export function validateDataConsistency(data: ValidatedVehicleResponse): boolean {
  const { vehicles, total, realTime, estimated } = data;

  // 基本的な整合性チェック
  if (total !== vehicles.length) {
    console.warn('Data consistency warning: total count does not match vehicles array length');
    return false;
  }

  if (realTime + estimated !== total) {
    console.warn('Data consistency warning: realTime + estimated does not equal total');
    return false;
  }

  // 車両データの個別チェック
  const estimatedCount = vehicles.filter(v => v.isEstimated).length;
  const realTimeCount = vehicles.filter(v => !v.isEstimated).length;

  if (estimatedCount !== estimated || realTimeCount !== realTime) {
    console.warn('Data consistency warning: vehicle estimation flags do not match counts');
    return false;
  }

  return true;
}

// エラー情報付きのレスポンス生成
export function createErrorResponse(error: string, lineId?: string): ValidatedVehicleResponse {
  return {
    vehicles: [],
    total: 0,
    realTime: 0,
    estimated: 0,
    lastFetch: new Date().toISOString()
  };
}