/**
 * Monitoring Types
 * 监控工具的类型定义
 */

export interface MetricLabels {
  [key: string]: string | number;
}

export interface MetricOptions {
  name: string;
  help: string;
  labels?: string[];
}

export interface CounterMetric {
  inc(value?: number, labels?: MetricLabels): void;
  get(labels?: MetricLabels): number;
}

export interface GaugeMetric {
  set(value: number, labels?: MetricLabels): void;
  inc(value?: number, labels?: MetricLabels): void;
  dec(value?: number, labels?: MetricLabels): void;
  get(labels?: MetricLabels): number;
}

export interface HistogramMetric {
  observe(value: number, labels?: MetricLabels): void;
  get(labels?: MetricLabels): HistogramData;
}

export interface HistogramData {
  count: number;
  sum: number;
  buckets: Map<number, number>;
}

export interface SummaryMetric {
  observe(value: number, labels?: MetricLabels): void;
  get(labels?: MetricLabels): SummaryData;
}

export interface SummaryData {
  count: number;
  sum: number;
  quantiles: Map<number, number>;
}

// Tracing Types
export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, unknown>;
  startTime?: number;
}

export enum SpanKind {
  INTERNAL = 'internal',
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
}

export enum SpanStatus {
  UNSET = 'unset',
  OK = 'ok',
  ERROR = 'error',
}

export interface Span {
  context: SpanContext;
  setAttribute(key: string, value: unknown): void;
  setAttributes(attributes: Record<string, unknown>): void;
  addEvent(name: string, attributes?: Record<string, unknown>): void;
  setStatus(status: SpanStatus, message?: string): void;
  end(endTime?: number): void;
  isRecording(): boolean;
}

export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span;
  getCurrentSpan(): Span | null;
  withSpan<T>(span: Span, fn: () => T): T;
}

// Alert Types
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AlertRule {
  name: string;
  condition: (value: number) => boolean;
  severity: AlertSeverity;
  message: string;
  cooldown?: number; // 冷却时间（毫秒）
}

export interface Alert {
  id: string;
  rule: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface AlertHandler {
  (alert: Alert): void | Promise<void>;
}

// HTTP Monitoring Types
export interface HttpMetrics {
  requestCount: CounterMetric;
  requestDuration: HistogramMetric;
  requestSize: HistogramMetric;
  responseSize: HistogramMetric;
  activeRequests: GaugeMetric;
}

// Database Monitoring Types
export interface DatabaseMetrics {
  queryCount: CounterMetric;
  queryDuration: HistogramMetric;
  connectionPoolSize: GaugeMetric;
  connectionPoolActive: GaugeMetric;
  connectionPoolIdle: GaugeMetric;
}

// System Monitoring Types
export interface SystemMetrics {
  cpuUsage: GaugeMetric;
  memoryUsage: GaugeMetric;
  memoryTotal: GaugeMetric;
  heapUsed: GaugeMetric;
  heapTotal: GaugeMetric;
  eventLoopLag: HistogramMetric;
}

// Custom Business Metrics Types
export interface BusinessMetrics {
  [key: string]: CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;
}

export interface MonitoringConfig {
  enabled: boolean;
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  metrics?: {
    enabled: boolean;
    prefix?: string;
    defaultLabels?: MetricLabels;
  };
  tracing?: {
    enabled: boolean;
    sampleRate?: number;
    exporterUrl?: string;
  };
  alerts?: {
    enabled: boolean;
    defaultCooldown?: number;
  };
}
