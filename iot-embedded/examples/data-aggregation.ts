/**
 * Data Aggregation Example
 * Demonstrates sensor data collection, aggregation, and time-series storage
 */

// ===== Type Definitions =====

/**
 * Sensor reading
 */
export interface SensorReading {
  sensorId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: number;
  quality: 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

/**
 * Aggregated data point
 */
export interface AggregatedDataPoint {
  sensorType: string;
  windowStart: number;
  windowEnd: number;
  count: number;
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    sum: number;
  };
  percentiles?: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * Time-series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  windowSize: number; // milliseconds
  aggregationInterval: number; // milliseconds
  functions: ('min' | 'max' | 'mean' | 'median' | 'sum' | 'count' | 'stdDev')[];
  includePercentiles: boolean;
  retention: {
    raw: number; // milliseconds
    aggregated: number; // milliseconds
  };
}

/**
 * Time-series query
 */
export interface TimeSeriesQuery {
  sensorType?: string;
  startTime: number;
  endTime: number;
  aggregation?: 'raw' | '1m' | '5m' | '15m' | '1h' | '1d';
  limit?: number;
}

// ===== Data Aggregation Service =====

/**
 * Service for collecting and aggregating sensor data
 */
export class DataAggregationService {
  private rawData: Map<string, SensorReading[]> = new Map();
  private aggregatedData: Map<string, AggregatedDataPoint[]> = new Map();
  private config: AggregationConfig;
  private aggregationTimer?: NodeJS.Timeout;

  constructor(config: AggregationConfig) {
    this.config = config;
  }

  /**
   * Start data aggregation
   */
  public start(): void {
    console.log('Starting data aggregation service');
    console.log(`  Window Size: ${this.config.windowSize / 1000}s`);
    console.log(`  Aggregation Interval: ${this.config.aggregationInterval / 1000}s`);
    console.log(`  Functions: ${this.config.functions.join(', ')}`);

    // Start periodic aggregation
    this.aggregationTimer = setInterval(() => {
      this.performAggregation();
    }, this.config.aggregationInterval);
  }

  /**
   * Stop data aggregation
   */
  public stop(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }
    console.log('Data aggregation service stopped');
  }

  /**
   * Collect sensor reading
   */
  public collectReading(reading: SensorReading): void {
    const key = reading.sensorType;

    if (!this.rawData.has(key)) {
      this.rawData.set(key, []);
    }

    this.rawData.get(key)!.push(reading);

    console.log(
      `Collected: ${reading.sensorType} = ${reading.value} ${reading.unit} ` +
      `(quality: ${reading.quality})`
    );

    // Clean up old raw data
    this.cleanupRawData(key);
  }

  /**
   * Collect multiple readings in batch
   */
  public collectBatch(readings: SensorReading[]): void {
    console.log(`Collecting batch of ${readings.length} readings`);

    for (const reading of readings) {
      this.collectReading(reading);
    }
  }

  /**
   * Perform aggregation on collected data
   */
  private performAggregation(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;

    console.log(`\nPerforming aggregation for window: ${new Date(windowStart).toISOString()} to ${new Date(now).toISOString()}`);

    for (const [sensorType, readings] of this.rawData.entries()) {
      // Filter readings within the window
      const windowReadings = readings.filter(
        (r) => r.timestamp >= windowStart && r.timestamp <= now
      );

      if (windowReadings.length === 0) {
        continue;
      }

      // Calculate aggregations
      const aggregated = this.calculateAggregations(
        sensorType,
        windowReadings,
        windowStart,
        now
      );

      // Store aggregated data
      if (!this.aggregatedData.has(sensorType)) {
        this.aggregatedData.set(sensorType, []);
      }
      this.aggregatedData.get(sensorType)!.push(aggregated);

      console.log(`Aggregated ${sensorType}:`, {
        count: aggregated.count,
        mean: aggregated.statistics.mean.toFixed(2),
        min: aggregated.statistics.min.toFixed(2),
        max: aggregated.statistics.max.toFixed(2),
      });

      // Clean up old aggregated data
      this.cleanupAggregatedData(sensorType);
    }
  }

  /**
   * Calculate aggregation statistics
   */
  private calculateAggregations(
    sensorType: string,
    readings: SensorReading[],
    windowStart: number,
    windowEnd: number
  ): AggregatedDataPoint {
    const values = readings.map((r) => r.value);
    const sortedValues = [...values].sort((a, b) => a - b);

    const aggregated: AggregatedDataPoint = {
      sensorType,
      windowStart,
      windowEnd,
      count: readings.length,
      statistics: {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: this.calculateMean(values),
        median: this.calculateMedian(sortedValues),
        stdDev: this.calculateStdDev(values),
        sum: values.reduce((a, b) => a + b, 0),
      },
    };

    if (this.config.includePercentiles) {
      aggregated.percentiles = {
        p25: this.calculatePercentile(sortedValues, 25),
        p50: this.calculatePercentile(sortedValues, 50),
        p75: this.calculatePercentile(sortedValues, 75),
        p90: this.calculatePercentile(sortedValues, 90),
        p95: this.calculatePercentile(sortedValues, 95),
        p99: this.calculatePercentile(sortedValues, 99),
      };
    }

    return aggregated;
  }

  /**
   * Query time-series data
   */
  public query(query: TimeSeriesQuery): TimeSeriesDataPoint[] {
    console.log(`\nQuerying time-series data:`);
    console.log(`  Time Range: ${new Date(query.startTime).toISOString()} to ${new Date(query.endTime).toISOString()}`);
    console.log(`  Aggregation: ${query.aggregation || 'raw'}`);

    if (query.aggregation === 'raw') {
      return this.queryRawData(query);
    } else {
      return this.queryAggregatedData(query);
    }
  }

  /**
   * Query raw sensor data
   */
  private queryRawData(query: TimeSeriesQuery): TimeSeriesDataPoint[] {
    const results: TimeSeriesDataPoint[] = [];

    for (const [sensorType, readings] of this.rawData.entries()) {
      if (query.sensorType && sensorType !== query.sensorType) {
        continue;
      }

      const filtered = readings.filter(
        (r) => r.timestamp >= query.startTime && r.timestamp <= query.endTime
      );

      results.push(
        ...filtered.map((r) => ({
          timestamp: r.timestamp,
          value: r.value,
          tags: {
            sensorType: r.sensorType,
            sensorId: r.sensorId,
            quality: r.quality,
          },
        }))
      );
    }

    // Sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);

    // Apply limit if specified
    const limited = query.limit ? results.slice(0, query.limit) : results;

    console.log(`  Found ${limited.length} raw data points`);
    return limited;
  }

  /**
   * Query aggregated data
   */
  private queryAggregatedData(query: TimeSeriesQuery): TimeSeriesDataPoint[] {
    const results: TimeSeriesDataPoint[] = [];

    for (const [sensorType, aggregations] of this.aggregatedData.entries()) {
      if (query.sensorType && sensorType !== query.sensorType) {
        continue;
      }

      const filtered = aggregations.filter(
        (a) => a.windowStart >= query.startTime && a.windowEnd <= query.endTime
      );

      results.push(
        ...filtered.map((a) => ({
          timestamp: a.windowEnd,
          value: a.statistics.mean,
          tags: {
            sensorType: a.sensorType,
            count: a.count.toString(),
          },
        }))
      );
    }

    // Sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);

    // Apply limit if specified
    const limited = query.limit ? results.slice(0, query.limit) : results;

    console.log(`  Found ${limited.length} aggregated data points`);
    return limited;
  }

  /**
   * Export data to time-series database (simulated)
   */
  public async exportToTimeSeriesDB(sensorType: string): Promise<void> {
    console.log(`\nExporting ${sensorType} data to time-series database...`);

    const aggregations = this.aggregatedData.get(sensorType) || [];

    // Simulate writing to InfluxDB, TimescaleDB, or similar
    for (const agg of aggregations) {
      await this.writeToTimeSeriesDB({
        measurement: sensorType,
        timestamp: agg.windowEnd,
        fields: {
          min: agg.statistics.min,
          max: agg.statistics.max,
          mean: agg.statistics.mean,
          median: agg.statistics.median,
          stddev: agg.statistics.stdDev,
          count: agg.count,
        },
        tags: {
          sensor_type: sensorType,
        },
      });
    }

    console.log(`Exported ${aggregations.length} data points`);
  }

  /**
   * Get aggregation summary
   */
  public getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [sensorType, readings] of this.rawData.entries()) {
      const aggregations = this.aggregatedData.get(sensorType) || [];

      summary[sensorType] = {
        rawDataPoints: readings.length,
        aggregatedDataPoints: aggregations.length,
        oldestReading: readings.length > 0 ? new Date(readings[0].timestamp).toISOString() : null,
        newestReading: readings.length > 0 ? new Date(readings[readings.length - 1].timestamp).toISOString() : null,
      };
    }

    return summary;
  }

  // ===== Private Helper Methods =====

  /**
   * Clean up old raw data
   */
  private cleanupRawData(sensorType: string): void {
    const readings = this.rawData.get(sensorType);
    if (!readings) return;

    const cutoff = Date.now() - this.config.retention.raw;
    const filtered = readings.filter((r) => r.timestamp > cutoff);

    const removed = readings.length - filtered.length;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} old raw readings for ${sensorType}`);
      this.rawData.set(sensorType, filtered);
    }
  }

  /**
   * Clean up old aggregated data
   */
  private cleanupAggregatedData(sensorType: string): void {
    const aggregations = this.aggregatedData.get(sensorType);
    if (!aggregations) return;

    const cutoff = Date.now() - this.config.retention.aggregated;
    const filtered = aggregations.filter((a) => a.windowEnd > cutoff);

    const removed = aggregations.length - filtered.length;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} old aggregations for ${sensorType}`);
      this.aggregatedData.set(sensorType, filtered);
    }
  }

  /**
   * Calculate mean
   */
  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate median
   */
  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Simulate writing to time-series database
   */
  private async writeToTimeSeriesDB(data: any): Promise<void> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 10));

    // In real implementation, write to InfluxDB, TimescaleDB, etc.
    // Example: await influxDB.writePoint(data);
  }
}

// ===== Example Usage =====

async function main() {
  // Configure aggregation
  const config: AggregationConfig = {
    windowSize: 60000, // 1 minute
    aggregationInterval: 10000, // Aggregate every 10 seconds
    functions: ['min', 'max', 'mean', 'median', 'stdDev'],
    includePercentiles: true,
    retention: {
      raw: 3600000, // Keep raw data for 1 hour
      aggregated: 86400000, // Keep aggregated data for 24 hours
    },
  };

  // Create aggregation service
  const aggregationService = new DataAggregationService(config);
  aggregationService.start();

  // Simulate collecting sensor data
  console.log('\n=== Simulating Sensor Data Collection ===\n');

  const sensorIds = ['temp-001', 'temp-002', 'humid-001'];
  const collectInterval = setInterval(() => {
    const readings: SensorReading[] = [
      {
        sensorId: 'temp-001',
        sensorType: 'temperature',
        value: 20 + Math.random() * 10,
        unit: '°C',
        timestamp: Date.now(),
        quality: Math.random() > 0.1 ? 'good' : 'fair',
      },
      {
        sensorId: 'temp-002',
        sensorType: 'temperature',
        value: 22 + Math.random() * 8,
        unit: '°C',
        timestamp: Date.now(),
        quality: Math.random() > 0.05 ? 'good' : 'fair',
      },
      {
        sensorId: 'humid-001',
        sensorType: 'humidity',
        value: 50 + Math.random() * 30,
        unit: '%',
        timestamp: Date.now(),
        quality: Math.random() > 0.15 ? 'good' : 'poor',
      },
    ];

    aggregationService.collectBatch(readings);
  }, 2000); // Collect every 2 seconds

  // Wait 35 seconds to collect data
  await new Promise((resolve) => setTimeout(resolve, 35000));

  // Stop collecting
  clearInterval(collectInterval);

  // Display summary
  console.log('\n=== Aggregation Summary ===\n');
  const summary = aggregationService.getSummary();
  console.log(JSON.stringify(summary, null, 2));

  // Query data
  const endTime = Date.now();
  const startTime = endTime - 30000; // Last 30 seconds

  console.log('\n=== Query Raw Data ===');
  const rawData = aggregationService.query({
    sensorType: 'temperature',
    startTime,
    endTime,
    aggregation: 'raw',
    limit: 10,
  });
  console.log(`Sample data points: ${rawData.slice(0, 3).map((d) => `${d.value.toFixed(2)}°C`).join(', ')}`);

  console.log('\n=== Query Aggregated Data ===');
  const aggregatedData = aggregationService.query({
    sensorType: 'temperature',
    startTime,
    endTime,
    aggregation: '1m',
  });
  console.log(`Aggregated data points: ${aggregatedData.length}`);

  // Export to time-series database
  await aggregationService.exportToTimeSeriesDB('temperature');

  // Stop aggregation service
  aggregationService.stop();
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
