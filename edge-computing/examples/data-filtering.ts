/**
 * Edge Data Filtering Example
 *
 * Demonstrates intelligent data filtering at the edge to:
 * - Reduce bandwidth usage by 80-95%
 * - Filter out noise and redundant data
 * - Aggregate data before cloud upload
 * - Implement privacy-preserving data filtering
 * - Reduce cloud storage and processing costs
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SensorReading {
  timestamp: number;
  sensorId: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'light';
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

interface FilterRule {
  id: string;
  name: string;
  sensorType?: string;
  condition: (reading: SensorReading) => boolean;
  priority: number;
}

interface AggregatedData {
  timeWindow: { start: number; end: number };
  sensorId: string;
  type: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  stdDev: number;
}

interface FilterMetrics {
  totalReceived: number;
  filtered: number;
  uploaded: number;
  bandwidthSaved: number;
  filteringRate: number;
}

// ============================================================================
// Edge Data Filter
// ============================================================================

class EdgeDataFilter {
  private rules: FilterRule[] = [];
  private metrics: FilterMetrics = {
    totalReceived: 0,
    filtered: 0,
    uploaded: 0,
    bandwidthSaved: 0,
    filteringRate: 0,
  };

  private buffer: SensorReading[] = [];
  private lastReadings = new Map<string, SensorReading>();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize common filtering rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Filter duplicate readings (no change in value)
    this.addRule({
      id: 'deduplicate',
      name: 'Deduplicate unchanged values',
      condition: (reading) => {
        const last = this.lastReadings.get(reading.sensorId);
        if (!last) return true; // Keep first reading

        // Filter if value unchanged
        return Math.abs(reading.value - last.value) > 0.001;
      },
      priority: 1,
    });

    // Rule 2: Filter noise (rapid fluctuations)
    this.addRule({
      id: 'denoise',
      name: 'Filter noise and outliers',
      condition: (reading) => {
        const last = this.lastReadings.get(reading.sensorId);
        if (!last) return true;

        // Filter if change is too rapid (likely noise)
        const timeDiff = reading.timestamp - last.timestamp;
        const valueDiff = Math.abs(reading.value - last.value);
        const changeRate = valueDiff / (timeDiff / 1000); // per second

        // Threshold depends on sensor type
        const maxChangeRate = this.getMaxChangeRate(reading.type);
        return changeRate <= maxChangeRate;
      },
      priority: 2,
    });

    // Rule 3: Sample rate limiting
    this.addRule({
      id: 'rate-limit',
      name: 'Limit sampling rate',
      condition: (reading) => {
        const last = this.lastReadings.get(reading.sensorId);
        if (!last) return true;

        // Keep only if enough time has passed (min 5 seconds)
        const timeDiff = reading.timestamp - last.timestamp;
        return timeDiff >= 5000;
      },
      priority: 3,
    });

    // Rule 4: Value range filter
    this.addRule({
      id: 'range-check',
      name: 'Filter out-of-range values',
      condition: (reading) => {
        const ranges = this.getValidRanges(reading.type);
        return reading.value >= ranges.min && reading.value <= ranges.max;
      },
      priority: 4,
    });
  }

  /**
   * Add custom filter rule
   */
  addRule(rule: FilterRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
    console.log(`[Filter] Added rule: ${rule.name}`);
  }

  /**
   * Remove filter rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    console.log(`[Filter] Removed rule: ${ruleId}`);
  }

  /**
   * Process incoming sensor reading
   */
  async processReading(reading: SensorReading): Promise<boolean> {
    this.metrics.totalReceived++;

    // Apply all filter rules
    for (const rule of this.rules) {
      // Skip if rule is sensor-specific and doesn't match
      if (rule.sensorType && rule.sensorType !== reading.type) {
        continue;
      }

      // Check if reading passes the filter
      if (!rule.condition(reading)) {
        this.metrics.filtered++;
        console.log(`[Filter] Reading filtered by rule: ${rule.name}`);
        return false;
      }
    }

    // Reading passed all filters
    this.lastReadings.set(reading.sensorId, reading);
    this.buffer.push(reading);

    return true;
  }

  /**
   * Batch process multiple readings
   */
  async processBatch(readings: SensorReading[]): Promise<SensorReading[]> {
    const accepted: SensorReading[] = [];

    for (const reading of readings) {
      const passed = await this.processReading(reading);
      if (passed) {
        accepted.push(reading);
      }
    }

    console.log(`[Filter] Batch processed: ${readings.length} received, ${accepted.length} accepted`);
    return accepted;
  }

  /**
   * Get buffered data for upload
   */
  getBufferedData(): SensorReading[] {
    const data = [...this.buffer];
    this.buffer = [];
    this.metrics.uploaded += data.length;
    this.updateMetrics();
    return data;
  }

  /**
   * Aggregate buffered data by time windows
   */
  aggregateData(windowSizeMs: number = 60000): AggregatedData[] {
    if (this.buffer.length === 0) return [];

    // Group by sensor and time window
    const windows = new Map<string, SensorReading[]>();

    for (const reading of this.buffer) {
      const windowStart = Math.floor(reading.timestamp / windowSizeMs) * windowSizeMs;
      const key = `${reading.sensorId}-${windowStart}`;

      if (!windows.has(key)) {
        windows.set(key, []);
      }
      windows.get(key)!.push(reading);
    }

    // Calculate aggregations
    const aggregated: AggregatedData[] = [];

    for (const [key, readings] of windows) {
      const values = readings.map(r => r.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Calculate standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      aggregated.push({
        timeWindow: {
          start: Math.min(...readings.map(r => r.timestamp)),
          end: Math.max(...readings.map(r => r.timestamp)),
        },
        sensorId: readings[0].sensorId,
        type: readings[0].type,
        count: readings.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
      });
    }

    // Clear buffer after aggregation
    this.buffer = [];
    this.metrics.uploaded += aggregated.length;
    this.updateMetrics();

    console.log(`[Filter] Aggregated ${this.buffer.length} readings into ${aggregated.length} summaries`);

    return aggregated;
  }

  /**
   * Implement privacy-preserving filtering
   */
  applyPrivacyFilter(reading: SensorReading): SensorReading {
    // Add noise for differential privacy
    const noise = this.generateLaplaceNoise(0.1);

    // Round values to reduce precision
    const privacyReading: SensorReading = {
      ...reading,
      value: Math.round((reading.value + noise) * 10) / 10,
      metadata: {
        ...reading.metadata,
        privacyPreserved: true,
      },
    };

    // Remove potentially identifying metadata
    delete privacyReading.metadata?.deviceId;
    delete privacyReading.metadata?.location;

    return privacyReading;
  }

  /**
   * Get filtering metrics
   */
  getMetrics(): FilterMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalReceived: 0,
      filtered: 0,
      uploaded: 0,
      bandwidthSaved: 0,
      filteringRate: 0,
    };
  }

  // Helper methods

  private getMaxChangeRate(type: string): number {
    const rates: Record<string, number> = {
      temperature: 5,    // 5°C per second max
      humidity: 10,      // 10% per second max
      pressure: 100,     // 100 Pa per second max
      motion: 1000,      // High for motion sensors
      light: 500,        // 500 lux per second max
    };
    return rates[type] || 100;
  }

  private getValidRanges(type: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      temperature: { min: -50, max: 100 },
      humidity: { min: 0, max: 100 },
      pressure: { min: 800, max: 1200 },
      motion: { min: 0, max: 1 },
      light: { min: 0, max: 10000 },
    };
    return ranges[type] || { min: -Infinity, max: Infinity };
  }

  private generateLaplaceNoise(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private updateMetrics(): void {
    if (this.metrics.totalReceived > 0) {
      this.metrics.filteringRate = this.metrics.filtered / this.metrics.totalReceived;
      // Estimate bandwidth saved (assume 100 bytes per reading)
      this.metrics.bandwidthSaved = this.metrics.filtered * 100;
    }
  }
}

// ============================================================================
// Smart Upload Manager
// ============================================================================

class SmartUploadManager {
  private uploadThreshold = 100; // Upload when buffer reaches this size
  private uploadInterval = 300000; // Or every 5 minutes
  private uploadTimer: NodeJS.Timeout | null = null;

  constructor(private filter: EdgeDataFilter) {}

  /**
   * Start automatic uploads
   */
  startAutoUpload(uploadCallback: (data: any[]) => Promise<void>): void {
    console.log('[Upload] Starting auto-upload');

    this.uploadTimer = setInterval(async () => {
      await this.performUpload(uploadCallback);
    }, this.uploadInterval);
  }

  /**
   * Stop automatic uploads
   */
  stopAutoUpload(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
      console.log('[Upload] Auto-upload stopped');
    }
  }

  /**
   * Perform upload if threshold met
   */
  private async performUpload(uploadCallback: (data: any[]) => Promise<void>): Promise<void> {
    const data = this.filter.getBufferedData();

    if (data.length === 0) {
      console.log('[Upload] No data to upload');
      return;
    }

    console.log(`[Upload] Uploading ${data.length} readings...`);

    try {
      await uploadCallback(data);
      console.log('[Upload] Upload successful');
    } catch (error) {
      console.error('[Upload] Upload failed:', error);
    }
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Edge Data Filtering Example ===\n');

  const filter = new EdgeDataFilter();

  // Simulate sensor readings
  console.log('1. Generating simulated sensor data...');
  const readings: SensorReading[] = [];
  const sensorIds = ['temp-001', 'temp-002', 'humid-001'];

  for (let i = 0; i < 100; i++) {
    const sensorId = sensorIds[i % sensorIds.length];
    const type = sensorId.startsWith('temp') ? 'temperature' : 'humidity';

    readings.push({
      timestamp: Date.now() + i * 1000,
      sensorId,
      type,
      value: type === 'temperature' ? 20 + Math.random() * 10 : 40 + Math.random() * 20,
      unit: type === 'temperature' ? '°C' : '%',
    });
  }

  // Process readings through filter
  console.log('\n2. Processing readings through filters...');
  const accepted = await filter.processBatch(readings);

  console.log(`\nFilter Results:`);
  console.log(`- Total received: ${readings.length}`);
  console.log(`- Accepted: ${accepted.length}`);
  console.log(`- Filtered: ${readings.length - accepted.length}`);
  console.log(`- Filtering rate: ${((1 - accepted.length / readings.length) * 100).toFixed(1)}%`);

  // Show metrics
  console.log('\n3. Filter Metrics:');
  const metrics = filter.getMetrics();
  console.log(JSON.stringify(metrics, null, 2));

  // Demonstrate aggregation
  console.log('\n4. Aggregating data (60-second windows)...');
  const aggregated = filter.aggregateData(60000);
  console.log(`Created ${aggregated.length} aggregated summaries:`);
  aggregated.forEach((agg, i) => {
    console.log(`  Window ${i + 1}:`, {
      sensor: agg.sensorId,
      count: agg.count,
      avg: agg.avg,
      range: `${agg.min} - ${agg.max}`,
    });
  });

  // Demonstrate privacy filtering
  console.log('\n5. Privacy-preserving filtering...');
  const sampleReading = readings[0];
  const privateReading = filter.applyPrivacyFilter(sampleReading);
  console.log('Original:', { value: sampleReading.value, metadata: sampleReading.metadata });
  console.log('Privacy-preserved:', { value: privateReading.value, metadata: privateReading.metadata });

  // Custom rule example
  console.log('\n6. Adding custom filter rule...');
  filter.addRule({
    id: 'high-temp-alert',
    name: 'Alert on high temperature',
    sensorType: 'temperature',
    condition: (reading) => {
      if (reading.value > 30) {
        console.log(`[ALERT] High temperature detected: ${reading.value}°C`);
      }
      return true; // Don't filter, just alert
    },
    priority: 0,
  });

  console.log('\n=== Edge Data Filtering Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { EdgeDataFilter, SmartUploadManager, SensorReading, FilterRule, AggregatedData };
