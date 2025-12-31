/**
 * Distributed Tracing (OpenTelemetry)
 * 分布式追踪（基于 OpenTelemetry 标准）
 */

import {
  SpanContext,
  SpanOptions,
  SpanKind,
  SpanStatus,
  Span,
  Tracer,
} from './types';

// Span attribute value types (OpenTelemetry compatible)
type SpanAttributeValue = string | number | boolean | undefined;

// Span data structure for export
interface SpanData {
  name: string;
  context: SpanContext;
  kind: SpanKind;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: Record<string, SpanAttributeValue>;
  events: SpanEvent[];
  status: SpanStatus;
  statusMessage?: string;
}

/**
 * 生成随机 ID
 */
function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Span Event
 */
interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, SpanAttributeValue>;
}

/**
 * Span Implementation
 */
class SpanImpl implements Span {
  context: SpanContext;
  private name: string;
  private kind: SpanKind;
  private startTime: number;
  private endTime?: number;
  private attributes: Record<string, SpanAttributeValue> = {};
  private events: SpanEvent[] = [];
  private status: SpanStatus = SpanStatus.UNSET;
  private statusMessage?: string;
  private recording: boolean = true;

  constructor(
    name: string,
    parentContext?: SpanContext,
    options?: SpanOptions
  ) {
    this.name = name;
    this.kind = options?.kind || SpanKind.INTERNAL;
    this.startTime = options?.startTime || Date.now();

    // 生成 span context
    const context: SpanContext = {
      traceId: parentContext?.traceId || generateId(32),
      spanId: generateId(16),
      traceFlags: parentContext?.traceFlags || 1,
    };
    if (parentContext?.spanId !== undefined) {
      context.parentSpanId = parentContext.spanId;
    }
    this.context = context;

    if (options?.attributes) {
      this.attributes = { ...options.attributes };
    }
  }

  setAttribute(key: string, value: SpanAttributeValue): void {
    if (this.recording) {
      this.attributes[key] = value;
    }
  }

  setAttributes(attributes: Record<string, SpanAttributeValue>): void {
    if (this.recording) {
      Object.assign(this.attributes, attributes);
    }
  }

  addEvent(name: string, attributes?: Record<string, SpanAttributeValue>): void {
    if (this.recording) {
      const event: SpanEvent = {
        name,
        timestamp: Date.now(),
      };
      if (attributes !== undefined) {
        event.attributes = attributes;
      }
      this.events.push(event);
    }
  }

  setStatus(status: SpanStatus, message?: string): void {
    if (this.recording) {
      this.status = status;
      if (message !== undefined) {
        this.statusMessage = message;
      }
    }
  }

  end(endTime?: number): void {
    if (this.recording) {
      this.endTime = endTime || Date.now();
      this.recording = false;

      // 导出 span
      TracerImpl.exportSpan(this.toJSON());
    }
  }

  isRecording(): boolean {
    return this.recording;
  }

  toJSON(): SpanData {
    return {
      name: this.name,
      context: this.context,
      kind: this.kind,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : undefined,
      attributes: this.attributes,
      events: this.events,
      status: this.status,
      statusMessage: this.statusMessage,
    };
  }
}

/**
 * Async Local Storage for context propagation
 */
class AsyncLocalStorage<T> {
  private store = new Map<object, T>();
  private currentId: object | null = null;

  run<R>(context: T, fn: () => R): R {
    const id = {};
    this.store.set(id, context);
    const previousId = this.currentId;
    this.currentId = id;

    try {
      return fn();
    } finally {
      this.currentId = previousId;
      this.store.delete(id);
    }
  }

  getStore(): T | undefined {
    return this.currentId ? this.store.get(this.currentId) : undefined;
  }
}

/**
 * Context storage
 */
interface TracingContext {
  span: Span;
}

const asyncLocalStorage = new AsyncLocalStorage<TracingContext>();

/**
 * Span Exporter Interface
 */
export interface SpanExporter {
  export(spans: SpanData[]): void | Promise<void>;
}

/**
 * Console Span Exporter
 */
export class ConsoleSpanExporter implements SpanExporter {
  export(spans: SpanData[]): void {
    spans.forEach((span) => {
      console.log('[Trace]', JSON.stringify(span, null, 2));
    });
  }
}

/**
 * Batch Span Exporter
 */
export class BatchSpanExporter implements SpanExporter {
  private spans: SpanData[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private timer?: NodeJS.Timeout | undefined;
  private exporter: SpanExporter;

  constructor(
    exporter: SpanExporter,
    batchSize: number = 100,
    batchTimeout: number = 5000
  ) {
    this.exporter = exporter;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }

  export(spans: SpanData[]): void {
    this.spans.push(...spans);

    if (this.spans.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (this.spans.length > 0) {
      const toExport = this.spans.splice(0, this.spans.length);
      this.exporter.export(toExport);
    }
  }

  shutdown(): void {
    this.flush();
  }
}

/**
 * HTTP Span Exporter (for OTLP)
 */
export class HttpSpanExporter implements SpanExporter {
  private url: string;
  private headers: Record<string, string>;

  constructor(
    url: string,
    headers: Record<string, string> = {}
  ) {
    this.url = url;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async export(spans: SpanData[]): Promise<void> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ spans }),
      });

      if (!response.ok) {
        console.error('Failed to export spans:', response.statusText);
      }
    } catch (error) {
      console.error('Error exporting spans:', error);
    }
  }
}

/**
 * Tracer Implementation
 */
class TracerImpl implements Tracer {
  private static exporter: SpanExporter = new ConsoleSpanExporter();
  private static sampleRate: number = 1.0;

  static setExporter(exporter: SpanExporter): void {
    this.exporter = exporter;
  }

  static setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }

  static exportSpan(span: SpanData): void {
    // 采样决策
    if (Math.random() > this.sampleRate) {
      return;
    }

    this.exporter.export([span]);
  }

  startSpan(name: string, options?: SpanOptions): Span {
    const parentContext = this.getCurrentSpan()?.context;
    return new SpanImpl(name, parentContext, options);
  }

  getCurrentSpan(): Span | null {
    const context = asyncLocalStorage.getStore();
    return context?.span || null;
  }

  withSpan<T>(span: Span, fn: () => T): T {
    return asyncLocalStorage.run({ span }, fn);
  }
}

/**
 * 默认的 tracer 实例
 */
export const defaultTracer = new TracerImpl();

/**
 * 配置 tracer
 */
export function configureTracer(options: {
  exporter?: SpanExporter;
  sampleRate?: number;
}): void {
  if (options.exporter) {
    TracerImpl.setExporter(options.exporter);
  }
  if (options.sampleRate !== undefined) {
    TracerImpl.setSampleRate(options.sampleRate);
  }
}

/**
 * HTTP 请求追踪装饰器
 */
// HTTP request type for tracing decorators
interface TracingHttpRequest {
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export function traceHttp(options?: {
  name?: string;
  extractHeaders?: boolean;
}) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const span = defaultTracer.startSpan(
        options?.name || `HTTP ${propertyKey}`,
        { kind: SpanKind.SERVER }
      );

      try {
        // 提取请求信息
        const req = args[0] as TracingHttpRequest | undefined;
        if (req) {
          span.setAttribute('http.method', req.method);
          span.setAttribute('http.url', req.url);
          span.setAttribute('http.target', req.path);

          if (options?.extractHeaders && req.headers) {
            // 提取追踪上下文
            const traceParent = req.headers['traceparent'];
            if (typeof traceParent === 'string') {
              span.setAttribute('http.traceparent', traceParent);
            }
          }
        }

        const result = await defaultTracer.withSpan(span, () =>
          originalMethod.apply(this, args)
        );

        span.setStatus(SpanStatus.OK);
        return result;
      } catch (error) {
        span.setStatus(SpanStatus.ERROR, (error as Error).message);
        span.setAttribute('error', true);
        span.setAttribute('error.message', (error as Error).message);
        span.setAttribute('error.stack', (error as Error).stack);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}

/**
 * 数据库查询追踪装饰器
 */
export function traceDatabase(options?: {
  name?: string;
  operation?: string;
}) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const span = defaultTracer.startSpan(
        options?.name || `DB ${propertyKey}`,
        { kind: SpanKind.CLIENT }
      );

      span.setAttribute('db.system', 'sql');
      if (options?.operation) {
        span.setAttribute('db.operation', options.operation);
      }

      // 提取 SQL 语句
      if (typeof args[0] === 'string') {
        span.setAttribute('db.statement', args[0]);
      }

      try {
        const result = await defaultTracer.withSpan(span, () =>
          originalMethod.apply(this, args)
        );

        span.setStatus(SpanStatus.OK);
        return result;
      } catch (error) {
        span.setStatus(SpanStatus.ERROR, (error as Error).message);
        span.setAttribute('error', true);
        span.setAttribute('error.message', (error as Error).message);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}

/**
 * 通用函数追踪装饰器
 */
export function trace(name?: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const span = defaultTracer.startSpan(
        name || `${(target.constructor as { name?: string }).name || 'Unknown'}.${propertyKey}`,
        { kind: SpanKind.INTERNAL }
      );

      try {
        const result = await defaultTracer.withSpan(span, () =>
          originalMethod.apply(this, args)
        );

        span.setStatus(SpanStatus.OK);
        return result;
      } catch (error) {
        span.setStatus(SpanStatus.ERROR, (error as Error).message);
        span.setAttribute('error', true);
        span.setAttribute('error.message', (error as Error).message);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}

/**
 * 手动追踪函数
 */
export async function traceAsync<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions
): Promise<T> {
  const span = defaultTracer.startSpan(name, options);

  try {
    const result = await defaultTracer.withSpan(span, () => fn(span));
    span.setStatus(SpanStatus.OK);
    return result;
  } catch (error) {
    span.setStatus(SpanStatus.ERROR, (error as Error).message);
    span.setAttribute('error', true);
    span.setAttribute('error.message', (error as Error).message);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * 同步追踪函数
 */
export function traceSync<T>(
  name: string,
  fn: (span: Span) => T,
  options?: SpanOptions
): T {
  const span = defaultTracer.startSpan(name, options);

  try {
    const result = defaultTracer.withSpan(span, () => fn(span));
    span.setStatus(SpanStatus.OK);
    return result;
  } catch (error) {
    span.setStatus(SpanStatus.ERROR, (error as Error).message);
    span.setAttribute('error', true);
    span.setAttribute('error.message', (error as Error).message);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * 提取 traceparent header
 */
export function extractTraceparent(span: Span): string {
  const { traceId, spanId, traceFlags } = span.context;
  const version = '00';
  const flags = traceFlags.toString(16).padStart(2, '0');
  return `${version}-${traceId}-${spanId}-${flags}`;
}

/**
 * 注入 traceparent header
 */
export function injectTraceparent(headers: Record<string, string>): void {
  const span = defaultTracer.getCurrentSpan();
  if (span) {
    headers['traceparent'] = extractTraceparent(span);
  }
}

/**
 * 解析 traceparent header
 */
export function parseTraceparent(traceparent: string): SpanContext | null {
  const parts = traceparent.split('-');
  if (parts.length !== 4) {
    return null;
  }

  const version = parts[0];
  const traceId = parts[1];
  const spanId = parts[2];
  const flags = parts[3];

  if (!version || !traceId || !spanId || !flags || version !== '00') {
    return null;
  }

  return {
    traceId,
    spanId,
    traceFlags: parseInt(flags, 16),
  };
}
