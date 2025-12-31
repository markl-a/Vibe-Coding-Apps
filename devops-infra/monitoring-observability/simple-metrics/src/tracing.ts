import type { Span, SpanContext, SpanEvent } from './types.js';
import { setTraceContext, clearTraceContext } from './logger.js';

/**
 * Distributed Tracing
 *
 * Simple tracing implementation for tracking request flow:
 * - Trace: End-to-end request flow
 * - Span: Individual operation within a trace
 */

// Generate random ID
function generateId(length = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Active spans storage
const activeSpans = new Map<string, SpanImpl>();
const completedSpans: Span[] = [];

/**
 * Span implementation
 */
class SpanImpl implements Span {
  name: string;
  context: SpanContext;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' = 'ok';
  attributes: Record<string, string | number | boolean> = {};
  events: SpanEvent[] = [];

  constructor(name: string, parentContext?: SpanContext) {
    this.name = name;
    this.startTime = performance.now();

    this.context = {
      traceId: parentContext?.traceId || generateId(32),
      spanId: generateId(16),
      parentSpanId: parentContext?.spanId,
    };

    // Set trace context for logger
    setTraceContext(this.context.traceId, this.context.spanId);
  }

  /**
   * Set span attribute
   */
  setAttribute(key: string, value: string | number | boolean): this {
    this.attributes[key] = value;
    return this;
  }

  /**
   * Set multiple attributes
   */
  setAttributes(attributes: Record<string, string | number | boolean>): this {
    Object.assign(this.attributes, attributes);
    return this;
  }

  /**
   * Add event to span
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): this {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
    return this;
  }

  /**
   * Set error status
   */
  setError(error: Error): this {
    this.status = 'error';
    this.setAttribute('error.type', error.name);
    this.setAttribute('error.message', error.message);
    if (error.stack) {
      this.setAttribute('error.stack', error.stack);
    }
    return this;
  }

  /**
   * End the span
   */
  end(): void {
    this.endTime = performance.now();
    activeSpans.delete(this.context.spanId);
    completedSpans.push(this);
    clearTraceContext();

    // Keep only last 1000 spans in memory
    if (completedSpans.length > 1000) {
      completedSpans.shift();
    }
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    const end = this.endTime ?? performance.now();
    return end - this.startTime;
  }
}

/**
 * Tracer for creating spans
 */
export class Tracer {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Start a new span
   */
  startSpan(name: string, parentContext?: SpanContext): SpanImpl {
    const span = new SpanImpl(name, parentContext);
    span.setAttribute('service.name', this.serviceName);
    activeSpans.set(span.context.spanId, span);
    return span;
  }

  /**
   * Wrap async function with tracing
   */
  async trace<T>(
    name: string,
    fn: (span: SpanImpl) => Promise<T>,
    parentContext?: SpanContext
  ): Promise<T> {
    const span = this.startSpan(name, parentContext);

    try {
      const result = await fn(span);
      span.end();
      return result;
    } catch (error) {
      span.setError(error as Error);
      span.end();
      throw error;
    }
  }

  /**
   * Create middleware for Express
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const span = this.startSpan('http_request');

      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.host': req.headers.host || 'unknown',
      });

      // Extract trace context from headers
      const traceParent = req.headers['traceparent'];
      if (traceParent) {
        const [, traceId, parentSpanId] = traceParent.split('-');
        span.context.traceId = traceId;
        span.context.parentSpanId = parentSpanId;
      }

      // Add trace ID to response headers
      res.setHeader('x-trace-id', span.context.traceId);

      // Store span on request for child spans
      req.span = span;

      // End span when response finishes
      res.on('finish', () => {
        span.setAttribute('http.status_code', res.statusCode);
        if (res.statusCode >= 400) {
          span.status = 'error';
        }
        span.end();
      });

      next();
    };
  }
}

/**
 * Get all completed spans
 */
export function getCompletedSpans(): Span[] {
  return [...completedSpans];
}

/**
 * Get active spans
 */
export function getActiveSpans(): Span[] {
  return Array.from(activeSpans.values());
}

/**
 * Clear all spans (for testing)
 */
export function clearSpans(): void {
  activeSpans.clear();
  completedSpans.length = 0;
}

/**
 * Export spans as JSON (for sending to tracing backend)
 */
export function exportSpans(): object[] {
  return completedSpans.map((span) => ({
    traceId: span.context.traceId,
    spanId: span.context.spanId,
    parentSpanId: span.context.parentSpanId,
    name: span.name,
    startTime: span.startTime,
    endTime: span.endTime,
    duration: span.endTime ? span.endTime - span.startTime : null,
    status: span.status,
    attributes: span.attributes,
    events: span.events,
  }));
}

// Export SpanImpl for type usage
export type { SpanImpl };
