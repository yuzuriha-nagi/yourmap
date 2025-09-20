// データサービス設定管理

export interface DataServiceSettings {
  nishitetsuService: {
    enabled: boolean;
    rateLimit: {
      maxRequests: number;
      windowMs: number;
    };
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    cacheEnabled: boolean;
    cacheTTL: number;
  };
  general: {
    fallbackEnabled: boolean;
    monitoringEnabled: boolean;
    debugMode: boolean;
  };
}

// デフォルト設定
export const DEFAULT_SETTINGS: DataServiceSettings = {
  nishitetsuService: {
    enabled: false, // 本番環境では無効化
    rateLimit: {
      maxRequests: 1,
      windowMs: 60000 // 1分間
    },
    timeout: 8000,
    retryAttempts: 1,
    retryDelay: 2000,
    cacheEnabled: true,
    cacheTTL: 60000 // 1分
  },
  general: {
    fallbackEnabled: true,
    monitoringEnabled: true,
    debugMode: process.env.NODE_ENV === 'development'
  }
};

// 環境変数から設定を読み込み
export function loadSettingsFromEnvironment(): DataServiceSettings {
  const settings = { ...DEFAULT_SETTINGS };

  // 環境変数による上書き
  if (process.env.NISHITETSU_SERVICE_ENABLED === 'true') {
    settings.nishitetsuService.enabled = true;
  }

  if (process.env.NISHITETSU_RATE_LIMIT_REQUESTS) {
    settings.nishitetsuService.rateLimit.maxRequests = parseInt(
      process.env.NISHITETSU_RATE_LIMIT_REQUESTS,
      10
    );
  }

  if (process.env.NISHITETSU_TIMEOUT) {
    settings.nishitetsuService.timeout = parseInt(process.env.NISHITETSU_TIMEOUT, 10);
  }

  if (process.env.MONITORING_ENABLED === 'false') {
    settings.general.monitoringEnabled = false;
  }

  if (process.env.DEBUG_MODE === 'true') {
    settings.general.debugMode = true;
  }

  return settings;
}

// 設定管理クラス
class DataServiceConfig {
  private settings: DataServiceSettings;
  private listeners: ((settings: DataServiceSettings) => void)[] = [];

  constructor() {
    this.settings = loadSettingsFromEnvironment();
  }

  // 設定取得
  getSettings(): DataServiceSettings {
    return { ...this.settings };
  }

  // 特定サービスの設定取得
  getNishitetsuSettings() {
    return { ...this.settings.nishitetsuService };
  }

  getGeneralSettings() {
    return { ...this.settings.general };
  }

  // 設定更新
  updateSettings(newSettings: Partial<DataServiceSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
      nishitetsuService: {
        ...this.settings.nishitetsuService,
        ...(newSettings.nishitetsuService || {})
      },
      general: {
        ...this.settings.general,
        ...(newSettings.general || {})
      }
    };

    // リスナーに通知
    this.listeners.forEach(listener => listener(this.settings));
  }

  // 西鉄サービス有効化
  enableNishitetsuService(): void {
    this.updateSettings({
      nishitetsuService: {
        ...this.settings.nishitetsuService,
        enabled: true
      }
    });
  }

  // 西鉄サービス無効化
  disableNishitetsuService(): void {
    this.updateSettings({
      nishitetsuService: {
        ...this.settings.nishitetsuService,
        enabled: false
      }
    });
  }

  // デバッグモード切り替え
  toggleDebugMode(): void {
    this.updateSettings({
      general: {
        ...this.settings.general,
        debugMode: !this.settings.general.debugMode
      }
    });
  }

  // 設定変更リスナー追加
  addListener(listener: (settings: DataServiceSettings) => void): void {
    this.listeners.push(listener);
  }

  // 設定変更リスナー削除
  removeListener(listener: (settings: DataServiceSettings) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 設定をローカルストレージに保存（クライアントサイドのみ）
  saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yourmap_data_service_settings', JSON.stringify(this.settings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
    }
  }

  // ローカルストレージから設定を復元（クライアントサイドのみ）
  loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yourmap_data_service_settings');
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          // セキュリティのため、一部の設定のみを復元
          this.updateSettings({
            general: {
              ...this.settings.general,
              debugMode: parsedSettings.general?.debugMode ?? this.settings.general.debugMode
            }
          });
        }
      } catch (error) {
        console.warn('Failed to load settings from localStorage:', error);
      }
    }
  }

  // 設定の検証
  validateSettings(settings: Partial<DataServiceSettings>): boolean {
    try {
      if (settings.nishitetsuService) {
        const ns = settings.nishitetsuService;

        if (ns.rateLimit && (
          typeof ns.rateLimit.maxRequests !== 'number' ||
          typeof ns.rateLimit.windowMs !== 'number' ||
          ns.rateLimit.maxRequests < 1 ||
          ns.rateLimit.windowMs < 1000
        )) {
          return false;
        }

        if (ns.timeout && (typeof ns.timeout !== 'number' || ns.timeout < 1000)) {
          return false;
        }

        if (ns.retryAttempts && (typeof ns.retryAttempts !== 'number' || ns.retryAttempts < 0)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  // 設定のリセット
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners.forEach(listener => listener(this.settings));
  }

  // 設定の概要取得
  getConfigSummary() {
    return {
      nishitetsuEnabled: this.settings.nishitetsuService.enabled,
      rateLimitEnabled: this.settings.nishitetsuService.rateLimit.maxRequests > 0,
      cacheEnabled: this.settings.nishitetsuService.cacheEnabled,
      monitoringEnabled: this.settings.general.monitoringEnabled,
      debugMode: this.settings.general.debugMode,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// シングルトンインスタンス
export const dataServiceConfig = new DataServiceConfig();

// 便利な関数エクスポート
export const isNishitetsuServiceEnabled = () => dataServiceConfig.getNishitetsuSettings().enabled;
export const isDebugMode = () => dataServiceConfig.getGeneralSettings().debugMode;
export const isMonitoringEnabled = () => dataServiceConfig.getGeneralSettings().monitoringEnabled;