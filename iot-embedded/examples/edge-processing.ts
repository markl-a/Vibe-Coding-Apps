/**
 * Edge Processing Example
 * Demonstrates local data processing, filtering/smoothing, and anomaly detection
 */

// ===== Type Definitions =====

/**
 * Raw sensor data
 */
export interface RawSensorData {
  sensorId: string;
  timestamp: number;
  value: number;
  unit: string;
}

/**
 * Processed sensor data
 */
export interface ProcessedSensorData extends RawSensorData {
  filtered: number;
  smoothed: number;
  isAnomaly: boolean;
  anomalyScore?: number;
  metadata: {
    processingTime: number;
    algorithm: string;
  };
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  type: 'moving-average' | 'exponential' | 'median' | 'kalman';
  windowSize?: number;
  alpha?: number; // For exponential smoothing
  threshold?: number; // For outlier removal
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  method: 'zscore' | 'iqr' | 'isolation-forest' | 'threshold';
  sensitivity: 'low' | 'medium' | 'high';
  windowSize: number;
  threshold?: number; // For threshold-based detection
}

/**
 * Edge processing statistics
 */
export interface EdgeProcessingStats {
  totalProcessed: number;
  anomaliesDetected: number;
  averageProcessingTime: number;
  dataReduction: number; // Percentage
  lastProcessed: number;
}

// ===== Edge Processing Service =====

/**
 * Service for local edge data processing
 */
export class EdgeProcessingService {
  private filterConfig: FilterConfig;
  private anomalyConfig: AnomalyDetectionConfig;
  private dataWindow: Map<string, number[]> = new Map();
  private timestampWindow: Map<string, number[]> = new Map();
  private stats: EdgeProcessingStats = {
    totalProcessed: 0,
    anomaliesDetected: 0,
    averageProcessingTime: 0,
    dataReduction: 0,
    lastProcessed: 0,
  };

  constructor(filterConfig: FilterConfig, anomalyConfig: AnomalyDetectionConfig) {
    this.filterConfig = filterConfig;
    this.anomalyConfig = anomalyConfig;
  }

  /**
   * Process raw sensor data
   */
  public process(data: RawSensorData): ProcessedSensorData {
    const startTime = Date.now();

    // Add to data window
    this.addToWindow(data.sensorId, data.value, data.timestamp);

    // Apply filtering
    const filtered = this.applyFilter(data.sensorId, data.value);

    // Apply smoothing
    const smoothed = this.applySmoothing(data.sensorId, filtered);

    // Detect anomalies
    const anomalyResult = this.detectAnomaly(data.sensorId, data.value);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Update statistics
    this.updateStats(processingTime, anomalyResult.isAnomaly);

    const processed: ProcessedSensorData = {
      ...data,
      filtered,
      smoothed,
      isAnomaly: anomalyResult.isAnomaly,
      anomalyScore: anomalyResult.score,
      metadata: {
        processingTime,
        algorithm: `${this.filterConfig.type}-${this.anomalyConfig.method}`,
      },
    };

    console.log(
      `Processed ${data.sensorId}: raw=${data.value.toFixed(2)}, ` +
      `filtered=${filtered.toFixed(2)}, smoothed=${smoothed.toFixed(2)}, ` +
      `anomaly=${anomalyResult.isAnomaly} (${processingTime}ms)`
    );

    return processed;
  }

  /**
   * Process batch of sensor data
   */
  public processBatch(dataArray: RawSensorData[]): ProcessedSensorData[] {
    console.log(`\nProcessing batch of ${dataArray.length} readings...`);
    return dataArray.map((data) => this.process(data));
  }

  /**
   * Apply filter to remove noise
   */
  private applyFilter(sensorId: string, value: number): number {
    const window = this.dataWindow.get(sensorId) || [];

    switch (this.filterConfig.type) {
      case 'moving-average':
        return this.movingAverage(window);

      case 'exponential':
        return this.exponentialSmoothing(window, this.filterConfig.alpha || 0.3);

      case 'median':
        return this.medianFilter(window);

      case 'kalman':
        return this.kalmanFilter(value, window);

      default:
        return value;
    }
  }

  /**
   * Apply smoothing to reduce variations
   */
  private applySmoothing(sensorId: string, value: number): number {
    const window = this.dataWindow.get(sensorId) || [];

    // Use exponential weighted moving average for smoothing
    const alpha = 0.2; // Smoothing factor
    return this.exponentialSmoothing([...window, value], alpha);
  }

  /**
   * Detect anomalies in sensor data
   */
  private detectAnomaly(
    sensorId: string,
    value: number
  ): { isAnomaly: boolean; score: number } {
    const window = this.dataWindow.get(sensorId) || [];

    if (window.length < this.anomalyConfig.windowSize) {
      return { isAnomaly: false, score: 0 };
    }

    switch (this.anomalyConfig.method) {
      case 'zscore':
        return this.zScoreAnomaly(value, window);

      case 'iqr':
        return this.iqrAnomaly(value, window);

      case 'threshold':
        return this.thresholdAnomaly(value, this.anomalyConfig.threshold || 100);

      case 'isolation-forest':
        return this.isolationForestAnomaly(value, window);

      default:
        return { isAnomaly: false, score: 0 };
    }
  }

  /**
   * Moving average filter
   */
  private movingAverage(window: number[]): number {
    if (window.length === 0) return 0;

    const windowSize = Math.min(this.filterConfig.windowSize || 5, window.length);
    const slice = window.slice(-windowSize);

    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  }

  /**
   * Exponential smoothing filter
   */
  private exponentialSmoothing(window: number[], alpha: number): number {
    if (window.length === 0) return 0;
    if (window.length === 1) return window[0];

    let smoothed = window[0];
    for (let i = 1; i < window.length; i++) {
      smoothed = alpha * window[i] + (1 - alpha) * smoothed;
    }

    return smoothed;
  }

  /**
   * Median filter
   */
  private medianFilter(window: number[]): number {
    if (window.length === 0) return 0;

    const windowSize = Math.min(this.filterConfig.windowSize || 5, window.length);
    const slice = window.slice(-windowSize);
    const sorted = [...slice].sort((a, b) => a - b);

    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Simplified Kalman filter
   */
  private kalmanFilter(measurement: number, window: number[]): number {
    if (window.length === 0) return measurement;

    // Simplified 1D Kalman filter
    const processNoise = 0.01;
    const measurementNoise = 0.1;

    const lastEstimate = window[window.length - 1];
    const prediction = lastEstimate;
    const predictionError = processNoise;

    const kalmanGain = predictionError / (predictionError + measurementNoise);
    const estimate = prediction + kalmanGain * (measurement - prediction);

    return estimate;
  }

  /**
   * Z-score anomaly detection
   */
  private zScoreAnomaly(
    value: number,
    window: number[]
  ): { isAnomaly: boolean; score: number } {
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);

    const zScore = Math.abs((value - mean) / stdDev);

    // Sensitivity thresholds
    const thresholds = {
      low: 3.0, // 99.7% confidence
      medium: 2.5, // 98.8% confidence
      high: 2.0, // 95.4% confidence
    };

    const threshold = thresholds[this.anomalyConfig.sensitivity];
    return {
      isAnomaly: zScore > threshold,
      score: zScore,
    };
  }

  /**
   * IQR (Interquartile Range) anomaly detection
   */
  private iqrAnomaly(
    value: number,
    window: number[]
  ): { isAnomaly: boolean; score: number } {
    const sorted = [...window].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // Sensitivity multipliers
    const multipliers = {
      low: 2.0,
      medium: 1.5,
      high: 1.0,
    };

    const multiplier = multipliers[this.anomalyConfig.sensitivity];
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const isAnomaly = value < lowerBound || value > upperBound;
    const score = Math.max(
      Math.abs(value - lowerBound) / iqr,
      Math.abs(value - upperBound) / iqr
    );

    return { isAnomaly, score };
  }

  /**
   * Threshold-based anomaly detection
   */
  private thresholdAnomaly(
    value: number,
    threshold: number
  ): { isAnomaly: boolean; score: number } {
    const isAnomaly = Math.abs(value) > threshold;
    const score = Math.abs(value) / threshold;

    return { isAnomaly, score };
  }

  /**
   * Simplified isolation forest anomaly detection
   */
  private isolationForestAnomaly(
    value: number,
    window: number[]
  ): { isAnomaly: boolean; score: number } {
    // Simplified version: use distance from mean and variance
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;

    // Anomaly score based on how isolated the value is
    const distance = Math.abs(value - mean);
    const score = distance / Math.sqrt(variance);

    const thresholds = {
      low: 3.0,
      medium: 2.0,
      high: 1.5,
    };

    const threshold = thresholds[this.anomalyConfig.sensitivity];
    return {
      isAnomaly: score > threshold,
      score,
    };
  }

  /**
   * Add value to sliding window
   */
  private addToWindow(sensorId: string, value: number, timestamp: number): void {
    if (!this.dataWindow.has(sensorId)) {
      this.dataWindow.set(sensorId, []);
      this.timestampWindow.set(sensorId, []);
    }

    const dataWin = this.dataWindow.get(sensorId)!;
    const timeWin = this.timestampWindow.get(sensorId)!;

    dataWin.push(value);
    timeWin.push(timestamp);

    // Keep window size limited
    const maxSize = Math.max(
      this.filterConfig.windowSize || 10,
      this.anomalyConfig.windowSize
    );

    if (dataWin.length > maxSize) {
      dataWin.shift();
      timeWin.shift();
    }
  }

  /**
   * Update processing statistics
   */
  private updateStats(processingTime: number, isAnomaly: boolean): void {
    this.stats.totalProcessed++;
    if (isAnomaly) {
      this.stats.anomaliesDetected++;
    }

    // Update average processing time
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) +
        processingTime) /
      this.stats.totalProcessed;

    this.stats.lastProcessed = Date.now();

    // Calculate data reduction (anomalies filtered out)
    this.stats.dataReduction =
      (this.stats.anomaliesDetected / this.stats.totalProcessed) * 100;
  }

  /**
   * Get processing statistics
   */
  public getStats(): EdgeProcessingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalProcessed: 0,
      anomaliesDetected: 0,
      averageProcessingTime: 0,
      dataReduction: 0,
      lastProcessed: 0,
    };
  }

  /**
   * Get sensor data window
   */
  public getWindow(sensorId: string): number[] {
    return [...(this.dataWindow.get(sensorId) || [])];
  }
}

// ===== Example Usage =====

async function main() {
  // Configure filtering
  const filterConfig: FilterConfig = {
    type: 'kalman',
    windowSize: 10,
    alpha: 0.3,
  };

  // Configure anomaly detection
  const anomalyConfig: AnomalyDetectionConfig = {
    method: 'zscore',
    sensitivity: 'medium',
    windowSize: 20,
  };

  // Create edge processing service
  const edgeProcessor = new EdgeProcessingService(filterConfig, anomalyConfig);

  console.log('=== Edge Processing Service Started ===\n');
  console.log('Filter Configuration:', filterConfig);
  console.log('Anomaly Detection Configuration:', anomalyConfig);

  // Simulate sensor data with noise and anomalies
  console.log('\n=== Processing Sensor Data ===\n');

  for (let i = 0; i < 50; i++) {
    // Generate base signal (sine wave)
    const baseValue = 25 + 5 * Math.sin((i * Math.PI) / 10);

    // Add noise
    const noise = (Math.random() - 0.5) * 2;

    // Inject anomalies occasionally
    const anomaly = i % 15 === 0 && i > 0 ? (Math.random() > 0.5 ? 15 : -15) : 0;

    const rawData: RawSensorData = {
      sensorId: 'temp-sensor-001',
      timestamp: Date.now(),
      value: baseValue + noise + anomaly,
      unit: '°C',
    };

    // Process data at the edge
    const processed = edgeProcessor.process(rawData);

    // Only send to cloud if not anomaly or if critical
    if (!processed.isAnomaly || (processed.anomalyScore && processed.anomalyScore > 5)) {
      // In real implementation: send to cloud
      // await cloudService.send(processed);
    }

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Display processing statistics
  console.log('\n=== Edge Processing Statistics ===\n');
  const stats = edgeProcessor.getStats();
  console.log(`Total Processed: ${stats.totalProcessed}`);
  console.log(`Anomalies Detected: ${stats.anomaliesDetected}`);
  console.log(`Average Processing Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
  console.log(`Data Reduction: ${stats.dataReduction.toFixed(2)}%`);

  // Test batch processing
  console.log('\n=== Batch Processing Test ===\n');

  const batchData: RawSensorData[] = Array.from({ length: 10 }, (_, i) => ({
    sensorId: 'humid-sensor-001',
    timestamp: Date.now() + i * 1000,
    value: 60 + Math.random() * 20,
    unit: '%',
  }));

  const processedBatch = edgeProcessor.processBatch(batchData);
  console.log(`Processed ${processedBatch.length} readings in batch`);

  const batchAnomalies = processedBatch.filter((p) => p.isAnomaly).length;
  console.log(`Batch anomalies: ${batchAnomalies}`);
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
