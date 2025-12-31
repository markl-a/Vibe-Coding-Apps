/**
 * Metrics and Observability Types
 */

// Metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricLabels {
  [key: string]: string;
}

export interface MetricConfig {
  name: string;
  help: string;
  type: MetricType;
  labels?: string[];
}

export interface MetricValue {
  value: number;
  labels: MetricLabels;
  timestamp: number;
}

export interface HistogramBuckets {
  [bound: string]: number;
}

export interface HistogramValue {
  buckets: HistogramBuckets;
  sum: number;
  count: number;
  labels: MetricLabels;
}

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
}

// Tracing
export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface Span {
  name: string;
  context: SpanContext;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

// Health check
export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    [name: string]: HealthCheckResult;
  };
  timestamp: Date;
}
