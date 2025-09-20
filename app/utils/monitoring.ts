// モニタリングとロギングシステム

export interface MonitoringEvent {
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
  duration?: number;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ServiceHealth {
  isHealthy: boolean;
  lastSuccessfulRequest: Date | null;
  consecutiveFailures: number;
  uptime: number;
  errorRate: number;
}

class MonitoringService {
  private events: MonitoringEvent[] = [];
  private metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: null,
    rateLimitHits: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private startTime: Date = new Date();
  private responseTimes: number[] = [];
  private readonly MAX_EVENTS = 1000; // 最大保持イベント数
  private readonly MAX_RESPONSE_TIMES = 100; // 平均計算用の最大サンプル数

  // イベントログ記録
  log(event: Omit<MonitoringEvent, 'timestamp'>): void {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);

    // 古いイベントを削除
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // コンソールにも出力
    const logLevel = event.type === 'error' ? 'error' :
                    event.type === 'warning' ? 'warn' : 'log';

    console[logLevel](`[${event.component}] ${event.message}`, event.metadata || '');
  }

  // API リクエストメトリクス記録
  recordRequest(success: boolean, responseTime: number, fromCache: boolean = false): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // レスポンス時間の記録と平均計算
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }

    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    this.log({
      type: success ? 'success' : 'error',
      component: 'API',
      message: `Request ${success ? 'succeeded' : 'failed'}`,
      metadata: {
        responseTime,
        fromCache,
        success
      },
      duration: responseTime
    });
  }

  // レート制限ヒット記録
  recordRateLimitHit(): void {
    this.metrics.rateLimitHits++;
    this.log({
      type: 'warning',
      component: 'RateLimit',
      message: 'Rate limit hit',
      metadata: {
        totalHits: this.metrics.rateLimitHits
      }
    });
  }

  // サービス健康状態取得
  getServiceHealth(): ServiceHealth {
    const now = new Date();
    const uptime = (now.getTime() - this.startTime.getTime()) / 1000; // 秒単位

    // 最後の成功リクエストを検索
    const lastSuccessfulRequest = this.events
      .filter(e => e.component === 'API' && e.type === 'success')
      .map(e => e.timestamp)
      .reduce((latest, current) => current > latest ? current : latest, this.startTime);

    // 連続失敗回数を計算
    let consecutiveFailures = 0;
    for (let i = this.events.length - 1; i >= 0; i--) {
      const event = this.events[i];
      if (event.component === 'API') {
        if (event.type === 'error') {
          consecutiveFailures++;
        } else if (event.type === 'success') {
          break;
        }
      }
    }

    // エラー率計算（過去100リクエスト）
    const recentAPIEvents = this.events
      .filter(e => e.component === 'API')
      .slice(-100);

    const errorRate = recentAPIEvents.length > 0
      ? recentAPIEvents.filter(e => e.type === 'error').length / recentAPIEvents.length
      : 0;

    const isHealthy = consecutiveFailures < 5 && errorRate < 0.5; // 連続5回失敗またはエラー率50%以上で不健康

    return {
      isHealthy,
      lastSuccessfulRequest: lastSuccessfulRequest > this.startTime ? lastSuccessfulRequest : null,
      consecutiveFailures,
      uptime,
      errorRate
    };
  }

  // メトリクス取得
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  // 最近のイベント取得
  getRecentEvents(limit: number = 50): MonitoringEvent[] {
    return this.events.slice(-limit).reverse(); // 新しい順
  }

  // 特定タイプのイベント取得
  getEventsByType(type: MonitoringEvent['type'], limit: number = 50): MonitoringEvent[] {
    return this.events
      .filter(e => e.type === type)
      .slice(-limit)
      .reverse();
  }

  // 統計情報取得
  getStats() {
    const health = this.getServiceHealth();
    const metrics = this.getMetrics();
    const recentErrors = this.getEventsByType('error', 10);
    const recentWarnings = this.getEventsByType('warning', 10);

    return {
      health,
      metrics,
      recentErrors: recentErrors.length,
      recentWarnings: recentWarnings.length,
      totalEvents: this.events.length,
      avgResponseTime: Math.round(metrics.averageResponseTime),
      successRate: metrics.totalRequests > 0
        ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100)
        : 0,
      cacheHitRate: (metrics.cacheHits + metrics.cacheMisses) > 0
        ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
        : 0
    };
  }

  // イベントクリア
  clearEvents(): void {
    this.events = [];
    this.log({
      type: 'info',
      component: 'Monitoring',
      message: 'Event log cleared'
    });
  }

  // メトリクスリセット
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.responseTimes = [];
    this.startTime = new Date();

    this.log({
      type: 'info',
      component: 'Monitoring',
      message: 'Metrics reset'
    });
  }

  // パフォーマンス測定ヘルパー
  async measurePerformance<T>(
    operation: () => Promise<T>,
    component: string,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.log({
        type: 'success',
        component,
        message: `${operationName} completed successfully`,
        metadata: { operationName },
        duration
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.log({
        type: 'error',
        component,
        message: `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          operationName,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        duration
      });

      throw error;
    }
  }
}

// シングルトンインスタンス
export const monitoringService = new MonitoringService();

// 便利な関数エクスポート
export const logInfo = (component: string, message: string, metadata?: Record<string, unknown>) => {
  monitoringService.log({ type: 'info', component, message, metadata });
};

export const logWarning = (component: string, message: string, metadata?: Record<string, unknown>) => {
  monitoringService.log({ type: 'warning', component, message, metadata });
};

export const logError = (component: string, message: string, metadata?: Record<string, unknown>) => {
  monitoringService.log({ type: 'error', component, message, metadata });
};

export const logSuccess = (component: string, message: string, metadata?: Record<string, unknown>) => {
  monitoringService.log({ type: 'success', component, message, metadata });
};

export default MonitoringService;