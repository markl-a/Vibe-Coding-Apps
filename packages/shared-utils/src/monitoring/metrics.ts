/**
 * Metrics Collection (Prometheus Format)
 * Prometheus 格式的指标收集
 */

import {
  MetricLabels,
  MetricOptions,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
  HistogramData,
  SummaryData,
  HttpMetrics,
  DatabaseMetrics,
  SystemMetrics,
  BusinessMetrics,
} from './types';

/**
 * Counter - 只增不减的计数器
 */
class Counter implements CounterMetric {
  private values: Map<string, number> = new Map();

  constructor(private options: MetricOptions) {}

  inc(value: number = 1, labels?: MetricLabels): void {
    const key = this.getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  get(labels?: MetricLabels): number {
    return this.values.get(this.getKey(labels)) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  private getKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  toPrometheus(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.options.name} ${this.options.help}`);
    lines.push(`# TYPE ${this.options.name} counter`);

    this.values.forEach((value, key) => {
      const labelStr = key ? `{${key}}` : '';
      lines.push(`${this.options.name}${labelStr} ${value}`);
    });

    return lines.join('\n');
  }
}

/**
 * Gauge - 可增可减的仪表盘
 */
class Gauge implements GaugeMetric {
  private values: Map<string, number> = new Map();

  constructor(private options: MetricOptions) {}

  set(value: number, labels?: MetricLabels): void {
    this.values.set(this.getKey(labels), value);
  }

  inc(value: number = 1, labels?: MetricLabels): void {
    const key = this.getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  dec(value: number = 1, labels?: MetricLabels): void {
    const key = this.getKey(labels);
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }

  get(labels?: MetricLabels): number {
    return this.values.get(this.getKey(labels)) || 0;
  }

  reset(): void {
    this.values.clear();
  }

  private getKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  toPrometheus(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.options.name} ${this.options.help}`);
    lines.push(`# TYPE ${this.options.name} gauge`);

    this.values.forEach((value, key) => {
      const labelStr = key ? `{${key}}` : '';
      lines.push(`${this.options.name}${labelStr} ${value}`);
    });

    return lines.join('\n');
  }
}

/**
 * Histogram - 直方图（用于观察分布）
 */
class Histogram implements HistogramMetric {
  private data: Map<string, HistogramData> = new Map();
  private buckets: number[];

  constructor(
    private options: MetricOptions,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ) {
    this.buckets = [...buckets, Infinity].sort((a, b) => a - b);
  }

  observe(value: number, labels?: MetricLabels): void {
    const key = this.getKey(labels);
    let data = this.data.get(key);

    if (!data) {
      data = {
        count: 0,
        sum: 0,
        buckets: new Map(this.buckets.map(b => [b, 0])),
      };
      this.data.set(key, data);
    }

    data.count++;
    data.sum += value;

    // 更新桶计数
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        data.buckets.set(bucket, (data.buckets.get(bucket) || 0) + 1);
      }
    }
  }

  get(labels?: MetricLabels): HistogramData {
    const key = this.getKey(labels);
    return this.data.get(key) || {
      count: 0,
      sum: 0,
      buckets: new Map(this.buckets.map(b => [b, 0])),
    };
  }

  reset(): void {
    this.data.clear();
  }

  private getKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  toPrometheus(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.options.name} ${this.options.help}`);
    lines.push(`# TYPE ${this.options.name} histogram`);

    this.data.forEach((data, key) => {
      const labelStr = key ? `{${key}}` : '';

      // 输出每个桶
      data.buckets.forEach((count, le) => {
        const bucketLabel = key ? `${key},le="${le}"` : `le="${le}"`;
        lines.push(`${this.options.name}_bucket{${bucketLabel}} ${count}`);
      });

      // 输出总和与计数
      lines.push(`${this.options.name}_sum${labelStr} ${data.sum}`);
      lines.push(`${this.options.name}_count${labelStr} ${data.count}`);
    });

    return lines.join('\n');
  }
}

/**
 * Summary - 摘要（用于观察分位数）
 */
class Summary implements SummaryMetric {
  private data: Map<string, SummaryData> = new Map();
  private observations: Map<string, number[]> = new Map();
  private quantiles: number[];

  constructor(
    private options: MetricOptions,
    quantiles: number[] = [0.5, 0.9, 0.95, 0.99]
  ) {
    this.quantiles = quantiles.sort((a, b) => a - b);
  }

  observe(value: number, labels?: MetricLabels): void {
    const key = this.getKey(labels);
    let observations = this.observations.get(key) || [];
    observations.push(value);
    this.observations.set(key, observations);

    // 计算摘要数据
    const sum = observations.reduce((a, b) => a + b, 0);
    const count = observations.length;
    const sorted = [...observations].sort((a, b) => a - b);
    const quantiles = new Map<number, number>();

    for (const q of this.quantiles) {
      const index = Math.ceil(sorted.length * q) - 1;
      quantiles.set(q, sorted[Math.max(0, index)]);
    }

    this.data.set(key, { count, sum, quantiles });
  }

  get(labels?: MetricLabels): SummaryData {
    const key = this.getKey(labels);
    return this.data.get(key) || {
      count: 0,
      sum: 0,
      quantiles: new Map(this.quantiles.map(q => [q, 0])),
    };
  }

  reset(): void {
    this.data.clear();
    this.observations.clear();
  }

  private getKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  toPrometheus(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.options.name} ${this.options.help}`);
    lines.push(`# TYPE ${this.options.name} summary`);

    this.data.forEach((data, key) => {
      const labelStr = key ? `{${key}}` : '';

      // 输出每个分位数
      data.quantiles.forEach((value, quantile) => {
        const quantileLabel = key ? `${key},quantile="${quantile}"` : `quantile="${quantile}"`;
        lines.push(`${this.options.name}{${quantileLabel}} ${value}`);
      });

      // 输出总和与计数
      lines.push(`${this.options.name}_sum${labelStr} ${data.sum}`);
      lines.push(`${this.options.name}_count${labelStr} ${data.count}`);
    });

    return lines.join('\n');
  }
}

/**
 * MetricsRegistry - 指标注册中心
 */
export class MetricsRegistry {
  private metrics: Map<string, Counter | Gauge | Histogram | Summary> = new Map();
  private prefix: string;
  private defaultLabels: MetricLabels;

  constructor(prefix: string = '', defaultLabels: MetricLabels = {}) {
    this.prefix = prefix;
    this.defaultLabels = defaultLabels;
  }

  counter(options: MetricOptions): CounterMetric {
    const name = this.prefix + options.name;
    let metric = this.metrics.get(name) as Counter;

    if (!metric) {
      metric = new Counter({ ...options, name });
      this.metrics.set(name, metric);
    }

    return metric;
  }

  gauge(options: MetricOptions): GaugeMetric {
    const name = this.prefix + options.name;
    let metric = this.metrics.get(name) as Gauge;

    if (!metric) {
      metric = new Gauge({ ...options, name });
      this.metrics.set(name, metric);
    }

    return metric;
  }

  histogram(options: MetricOptions, buckets?: number[]): HistogramMetric {
    const name = this.prefix + options.name;
    let metric = this.metrics.get(name) as Histogram;

    if (!metric) {
      metric = new Histogram({ ...options, name }, buckets);
      this.metrics.set(name, metric);
    }

    return metric;
  }

  summary(options: MetricOptions, quantiles?: number[]): SummaryMetric {
    const name = this.prefix + options.name;
    let metric = this.metrics.get(name) as Summary;

    if (!metric) {
      metric = new Summary({ ...options, name }, quantiles);
      this.metrics.set(name, metric);
    }

    return metric;
  }

  /**
   * 导出 Prometheus 格式的指标
   */
  export(): string {
    const lines: string[] = [];

    this.metrics.forEach((metric) => {
      if ('toPrometheus' in metric) {
        lines.push((metric as any).toPrometheus());
      }
    });

    return lines.join('\n\n');
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics.forEach((metric) => {
      if ('reset' in metric) {
        (metric as any).reset();
      }
    });
  }

  /**
   * 获取指标数量
   */
  getMetricCount(): number {
    return this.metrics.size;
  }
}

/**
 * 创建默认的 HTTP 指标
 */
export function createHttpMetrics(registry: MetricsRegistry): HttpMetrics {
  return {
    requestCount: registry.counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labels: ['method', 'path', 'status'],
    }),
    requestDuration: registry.histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labels: ['method', 'path', 'status'],
    }, [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
    requestSize: registry.histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request size in bytes',
      labels: ['method', 'path'],
    }, [100, 1000, 10000, 100000, 1000000]),
    responseSize: registry.histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labels: ['method', 'path'],
    }, [100, 1000, 10000, 100000, 1000000]),
    activeRequests: registry.gauge({
      name: 'http_requests_active',
      help: 'Number of active HTTP requests',
      labels: ['method', 'path'],
    }),
  };
}

/**
 * 创建默认的数据库指标
 */
export function createDatabaseMetrics(registry: MetricsRegistry): DatabaseMetrics {
  return {
    queryCount: registry.counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labels: ['operation', 'table', 'status'],
    }),
    queryDuration: registry.histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labels: ['operation', 'table'],
    }, [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]),
    connectionPoolSize: registry.gauge({
      name: 'db_connection_pool_size',
      help: 'Database connection pool size',
    }),
    connectionPoolActive: registry.gauge({
      name: 'db_connection_pool_active',
      help: 'Number of active database connections',
    }),
    connectionPoolIdle: registry.gauge({
      name: 'db_connection_pool_idle',
      help: 'Number of idle database connections',
    }),
  };
}

/**
 * 创建默认的系统指标
 */
export function createSystemMetrics(registry: MetricsRegistry): SystemMetrics {
  const os = require('os');
  const v8 = require('v8');

  const metrics = {
    cpuUsage: registry.gauge({
      name: 'process_cpu_usage_percent',
      help: 'Process CPU usage percentage',
    }),
    memoryUsage: registry.gauge({
      name: 'process_memory_usage_bytes',
      help: 'Process memory usage in bytes',
      labels: ['type'],
    }),
    memoryTotal: registry.gauge({
      name: 'system_memory_total_bytes',
      help: 'Total system memory in bytes',
    }),
    heapUsed: registry.gauge({
      name: 'process_heap_used_bytes',
      help: 'Process heap used in bytes',
    }),
    heapTotal: registry.gauge({
      name: 'process_heap_total_bytes',
      help: 'Process heap total in bytes',
    }),
    eventLoopLag: registry.histogram({
      name: 'nodejs_eventloop_lag_seconds',
      help: 'Event loop lag in seconds',
    }, [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]),
  };

  // 定期更新系统指标
  const updateSystemMetrics = () => {
    // CPU 使用率
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - (100 * totalIdle / totalTick);
    metrics.cpuUsage.set(cpuUsage);

    // 内存使用率
    const mem = process.memoryUsage();
    metrics.memoryUsage.set(mem.rss, { type: 'rss' });
    metrics.memoryUsage.set(mem.heapUsed, { type: 'heap' });
    metrics.memoryUsage.set(mem.external, { type: 'external' });
    metrics.memoryTotal.set(os.totalmem());
    metrics.heapUsed.set(mem.heapUsed);
    metrics.heapTotal.set(mem.heapTotal);

    // Event Loop Lag
    const start = Date.now();
    setImmediate(() => {
      const lag = (Date.now() - start) / 1000;
      metrics.eventLoopLag.observe(lag);
    });
  };

  // 每 5 秒更新一次
  setInterval(updateSystemMetrics, 5000);
  updateSystemMetrics();

  return metrics;
}

/**
 * 默认的指标注册中心实例
 */
export const defaultRegistry = new MetricsRegistry();

/**
 * 创建自定义业务指标
 */
export function createBusinessMetrics(registry: MetricsRegistry): BusinessMetrics {
  return {
    userSignups: registry.counter({
      name: 'business_user_signups_total',
      help: 'Total number of user signups',
      labels: ['source'],
    }),
    userLogins: registry.counter({
      name: 'business_user_logins_total',
      help: 'Total number of user logins',
      labels: ['method'],
    }),
    orders: registry.counter({
      name: 'business_orders_total',
      help: 'Total number of orders',
      labels: ['status', 'payment_method'],
    }),
    revenue: registry.counter({
      name: 'business_revenue_total',
      help: 'Total revenue',
      labels: ['currency'],
    }),
    activeUsers: registry.gauge({
      name: 'business_active_users',
      help: 'Number of active users',
    }),
    orderValue: registry.histogram({
      name: 'business_order_value',
      help: 'Order value distribution',
      labels: ['currency'],
    }, [10, 50, 100, 500, 1000, 5000, 10000]),
  };
}
