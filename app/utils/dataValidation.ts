// データ検証ユーティリティ
// シンプルな検証を実装

// 車両データの型定義
export interface ValidatedVehicle {
  id: string;
  line: string;
  operator: string;
  destination: string;
  delay: number;
  currentStation?: string;
  trainNumber?: string;
  trainType?: string;
  lastUpdated: string | Date;
  isEstimated: boolean;
  type: 'train' | 'subway' | 'bus';
  position?: {
    latitude: number;
    longitude: number;
  };
}

// API レスポンスの型定義
export interface ValidatedVehicleResponse {
  vehicles: ValidatedVehicle[];
  total: number;
  realTime: number;
  estimated: number;
  lastFetch: string | Date;
}

// データ検証関数
export function validateVehicleData(data: unknown): ValidatedVehicleResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  const obj = data as any;

  // 必須フィールドの検証
  if (!Array.isArray(obj.vehicles)) {
    throw new Error('vehicles must be an array');
  }

  if (typeof obj.total !== 'number' || obj.total < 0) {
    throw new Error('total must be a non-negative number');
  }

  if (typeof obj.realTime !== 'number' || obj.realTime < 0) {
    throw new Error('realTime must be a non-negative number');
  }

  if (typeof obj.estimated !== 'number' || obj.estimated < 0) {
    throw new Error('estimated must be a non-negative number');
  }

  // 車両データの検証
  const validatedVehicles = obj.vehicles.map((vehicle: any, index: number) => {
    try {
      return validateSingleVehicle(vehicle);
    } catch (error) {
      throw new Error(`Vehicle at index ${index}: ${error instanceof Error ? error.message : 'validation failed'}`);
    }
  });

  return {
    vehicles: validatedVehicles,
    total: obj.total,
    realTime: obj.realTime,
    estimated: obj.estimated,
    lastFetch: obj.lastFetch || new Date().toISOString()
  };
}

// 個別車両データの検証
export function validateSingleVehicle(data: unknown): ValidatedVehicle {
  if (!data || typeof data !== 'object') {
    throw new Error('Vehicle data must be an object');
  }

  const obj = data as any;

  // 必須フィールドの検証
  if (!obj.id || typeof obj.id !== 'string') {
    throw new Error('id must be a non-empty string');
  }

  if (!obj.line || typeof obj.line !== 'string') {
    throw new Error('line must be a non-empty string');
  }

  if (!obj.operator || typeof obj.operator !== 'string') {
    throw new Error('operator must be a non-empty string');
  }

  if (!obj.destination || typeof obj.destination !== 'string') {
    throw new Error('destination must be a non-empty string');
  }

  if (typeof obj.delay !== 'number' || obj.delay < 0 || obj.delay > 999) {
    throw new Error('delay must be a number between 0 and 999');
  }

  if (typeof obj.isEstimated !== 'boolean') {
    throw new Error('isEstimated must be a boolean');
  }

  if (!['train', 'subway', 'bus'].includes(obj.type)) {
    throw new Error('type must be train, subway, or bus');
  }

  // オプションフィールドの検証
  if (obj.currentStation !== undefined && typeof obj.currentStation !== 'string') {
    throw new Error('currentStation must be a string if provided');
  }

  if (obj.trainNumber !== undefined && typeof obj.trainNumber !== 'string') {
    throw new Error('trainNumber must be a string if provided');
  }

  if (obj.trainType !== undefined && typeof obj.trainType !== 'string') {
    throw new Error('trainType must be a string if provided');
  }

  // 位置情報の検証
  if (obj.position !== undefined) {
    if (typeof obj.position !== 'object' || !obj.position) {
      throw new Error('position must be an object if provided');
    }

    const { latitude, longitude } = obj.position;
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new Error('latitude must be a number between -90 and 90');
    }

    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error('longitude must be a number between -180 and 180');
    }
  }

  return {
    id: obj.id,
    line: obj.line,
    operator: obj.operator,
    destination: obj.destination,
    delay: obj.delay,
    currentStation: obj.currentStation,
    trainNumber: obj.trainNumber,
    trainType: obj.trainType,
    lastUpdated: obj.lastUpdated || new Date(),
    isEstimated: obj.isEstimated,
    type: obj.type,
    position: obj.position
  };
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
export function generateFallbackVehicleData(): ValidatedVehicleResponse {
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
  const estimatedCount = vehicles.filter((v: ValidatedVehicle) => v.isEstimated).length;
  const realTimeCount = vehicles.filter((v: ValidatedVehicle) => !v.isEstimated).length;

  if (estimatedCount !== estimated || realTimeCount !== realTime) {
    console.warn('Data consistency warning: vehicle estimation flags do not match counts');
    return false;
  }

  return true;
}

// エラー情報付きのレスポンス生成
export function createErrorResponse(): ValidatedVehicleResponse {
  return {
    vehicles: [],
    total: 0,
    realTime: 0,
    estimated: 0,
    lastFetch: new Date().toISOString()
  };
}