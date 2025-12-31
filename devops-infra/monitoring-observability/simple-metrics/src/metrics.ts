import type { MetricConfig, MetricLabels, MetricValue, HistogramValue } from './types.js';

/**
 * Metrics Collection
 *
 * Provides Prometheus-compatible metrics:
 * - Counter: monotonically increasing value
 * - Gauge: value that can go up and down
 * - Histogram: distribution of values
 */

// Default histogram buckets
const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// Metric registry
const metrics = new Map<string, MetricConfig>();
const counterValues = new Map<string, Map<string, number>>();
const gaugeValues = new Map<string, Map<string, number>>();
const histogramValues = new Map<string, Map<string, HistogramValue>>();

/**
 * Create a unique key for labels
 */
function labelsToKey(labels: MetricLabels): string {
  const sortedKeys = Object.keys(labels).sort();
  return sortedKeys.map((k) => `${k}="${labels[k]}"`).join(',');
}

/**
 * Counter metric - only increases
 */
export class Counter {
  private name: string;
  private labels: string[];

  constructor(config: MetricConfig) {
    if (config.type !== 'counter') {
      throw new Error('Invalid metric type for Counter');
    }

    this.name = config.name;
    this.labels = config.labels || [];

    metrics.set(this.name, config);
    counterValues.set(this.name, new Map());
  }

  /**
   * Increment counter by value
   */
  inc(labels: MetricLabels = {}, value = 1): void {
    const key = labelsToKey(labels);
    const values = counterValues.get(this.name)!;
    const current = values.get(key) || 0;
    values.set(key, current + value);
  }

  /**
   * Get current value
   */
  get(labels: MetricLabels = {}): number {
    const key = labelsToKey(labels);
    return counterValues.get(this.name)?.get(key) || 0;
  }

  /**
   * Reset counter (for testing)
   */
  reset(): void {
    counterValues.get(this.name)?.clear();
  }
}

/**
 * Gauge metric - can go up and down
 */
export class Gauge {
  private name: string;
  private labels: string[];

  constructor(config: MetricConfig) {
    if (config.type !== 'gauge') {
      throw new Error('Invalid metric type for Gauge');
    }

    this.name = config.name;
    this.labels = config.labels || [];

    metrics.set(this.name, config);
    gaugeValues.set(this.name, new Map());
  }

  /**
   * Set gauge to value
   */
  set(labels: MetricLabels, value: number): void;
  set(value: number): void;
  set(labelsOrValue: MetricLabels | number, value?: number): void {
    if (typeof labelsOrValue === 'number') {
      const key = labelsToKey({});
      gaugeValues.get(this.name)!.set(key, labelsOrValue);
    } else {
      const key = labelsToKey(labelsOrValue);
      gaugeValues.get(this.name)!.set(key, value!);
    }
  }

  /**
   * Increment gauge
   */
  inc(labels: MetricLabels = {}, value = 1): void {
    const key = labelsToKey(labels);
    const values = gaugeValues.get(this.name)!;
    const current = values.get(key) || 0;
    values.set(key, current + value);
  }

  /**
   * Decrement gauge
   */
  dec(labels: MetricLabels = {}, value = 1): void {
    this.inc(labels, -value);
  }

  /**
   * Get current value
   */
  get(labels: MetricLabels = {}): number {
    const key = labelsToKey(labels);
    return gaugeValues.get(this.name)?.get(key) || 0;
  }

  /**
   * Set to current timestamp (useful for last_updated metrics)
   */
  setToCurrentTime(labels: MetricLabels = {}): void {
    this.set(labels, Date.now() / 1000);
  }

  /**
   * Timer helper - returns function to stop timer
   */
  startTimer(labels: MetricLabels = {}): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;
      this.set(labels, duration);
      return duration;
    };
  }
}

/**
 * Histogram metric - distribution of values
 */
export class Histogram {
  private name: string;
  private labels: string[];
  private buckets: number[];

  constructor(config: MetricConfig & { buckets?: number[] }) {
    if (config.type !== 'histogram') {
      throw new Error('Invalid metric type for Histogram');
    }

    this.name = config.name;
    this.labels = config.labels || [];
    this.buckets = config.buckets || DEFAULT_BUCKETS;

    metrics.set(this.name, config);
    histogramValues.set(this.name, new Map());
  }

  /**
   * Observe a value
   */
  observe(labels: MetricLabels, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: MetricLabels | number, value?: number): void {
    const labels = typeof labelsOrValue === 'number' ? {} : labelsOrValue;
    const observedValue = typeof labelsOrValue === 'number' ? labelsOrValue : value!;

    const key = labelsToKey(labels);
    const histograms = histogramValues.get(this.name)!;

    let histogram = histograms.get(key);
    if (!histogram) {
      histogram = {
        buckets: Object.fromEntries(this.buckets.map((b) => [b.toString(), 0])),
        sum: 0,
        count: 0,
        labels,
      };
      histograms.set(key, histogram);
    }

    // Update buckets
    for (const bucket of this.buckets) {
      if (observedValue <= bucket) {
        histogram.buckets[bucket.toString()]++;
      }
    }

    histogram.sum += observedValue;
    histogram.count++;
  }

  /**
   * Timer helper - observes duration
   */
  startTimer(labels: MetricLabels = {}): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;
      this.observe(labels, duration);
      return duration;
    };
  }

  /**
   * Get histogram data
   */
  get(labels: MetricLabels = {}): HistogramValue | undefined {
    const key = labelsToKey(labels);
    return histogramValues.get(this.name)?.get(key);
  }
}

/**
 * Format metrics in Prometheus text format
 */
export function formatMetrics(): string {
  const lines: string[] = [];

  // Counters
  for (const [name, config] of metrics) {
    if (config.type === 'counter') {
      lines.push(`# HELP ${name} ${config.help}`);
      lines.push(`# TYPE ${name} counter`);

      const values = counterValues.get(name);
      if (values) {
        for (const [labels, value] of values) {
          const labelStr = labels ? `{${labels}}` : '';
          lines.push(`${name}${labelStr} ${value}`);
        }
      }
    }

    if (config.type === 'gauge') {
      lines.push(`# HELP ${name} ${config.help}`);
      lines.push(`# TYPE ${name} gauge`);

      const values = gaugeValues.get(name);
      if (values) {
        for (const [labels, value] of values) {
          const labelStr = labels ? `{${labels}}` : '';
          lines.push(`${name}${labelStr} ${value}`);
        }
      }
    }

    if (config.type === 'histogram') {
      lines.push(`# HELP ${name} ${config.help}`);
      lines.push(`# TYPE ${name} histogram`);

      const histograms = histogramValues.get(name);
      if (histograms) {
        for (const [labels, histogram] of histograms) {
          const labelPrefix = labels ? `${labels},` : '';

          // Bucket values (cumulative)
          const bucketBounds = Object.keys(histogram.buckets)
            .map(Number)
            .sort((a, b) => a - b);

          let cumulative = 0;
          for (const bound of bucketBounds) {
            cumulative += histogram.buckets[bound.toString()];
            lines.push(`${name}_bucket{${labelPrefix}le="${bound}"} ${cumulative}`);
          }
          lines.push(`${name}_bucket{${labelPrefix}le="+Inf"} ${histogram.count}`);

          lines.push(`${name}_sum{${labels}} ${histogram.sum}`);
          lines.push(`${name}_count{${labels}} ${histogram.count}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get all metrics as JSON
 */
export function getMetricsJson(): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [name, config] of metrics) {
    if (config.type === 'counter') {
      const values = counterValues.get(name);
      result[name] = values ? Object.fromEntries(values) : {};
    }

    if (config.type === 'gauge') {
      const values = gaugeValues.get(name);
      result[name] = values ? Object.fromEntries(values) : {};
    }

    if (config.type === 'histogram') {
      const histograms = histogramValues.get(name);
      result[name] = histograms ? Object.fromEntries(histograms) : {};
    }
  }

  return result;
}

/**
 * Reset all metrics (for testing)
 */
export function resetAllMetrics(): void {
  for (const values of counterValues.values()) {
    values.clear();
  }
  for (const values of gaugeValues.values()) {
    values.clear();
  }
  for (const values of histogramValues.values()) {
    values.clear();
  }
}
