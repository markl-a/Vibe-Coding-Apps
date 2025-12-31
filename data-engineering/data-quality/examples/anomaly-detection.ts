/**
 * Anomaly Detection Examples
 *
 * Demonstrates various anomaly detection techniques:
 * 1. Statistical outlier detection (Z-score, IQR)
 * 2. Time-series anomaly detection
 * 3. Multivariate anomaly detection
 * 4. Pattern-based anomaly detection
 * 5. Isolation Forest algorithm
 * 6. Moving average and threshold detection
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface AnomalyDetectionResult {
  totalRecords: number;
  anomalyCount: number;
  anomalyPercentage: number;
  anomalies: Anomaly[];
  method: string;
  threshold?: number;
}

interface Anomaly {
  index: number;
  record: Record<string, unknown>;
  score: number;
  reason: string;
  field?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: Statistical Outlier Detection (Z-score)
// ============================================================================

class ZScoreDetector {
  constructor(private threshold: number = 3) {}

  detect(data: Record[], field: string): AnomalyDetectionResult {
    console.log('='.repeat(80));
    console.log(`Z-Score Outlier Detection: ${field}`);
    console.log(`Threshold: ${this.threshold} standard deviations`);
    console.log('='.repeat(80));

    const values = data
      .map(record => Number(record[field]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      throw new Error(`No numeric values found in field: ${field}`);
    }

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    console.log(`\nStatistics:`);
    console.log(`  Mean: ${mean.toFixed(2)}`);
    console.log(`  Std Dev: ${stddev.toFixed(2)}`);

    // Detect outliers
    const anomalies: Anomaly[] = [];

    data.forEach((record, index) => {
      const value = Number(record[field]);

      if (!isNaN(value)) {
        const zScore = Math.abs((value - mean) / stddev);

        if (zScore > this.threshold) {
          const severity = this.getSeverity(zScore, this.threshold);

          anomalies.push({
            index,
            record,
            score: zScore,
            reason: `Z-score ${zScore.toFixed(2)} exceeds threshold ${this.threshold}`,
            field,
            severity,
          });
        }
      }
    });

    console.log(`\nDetected ${anomalies.length} anomalies (${((anomalies.length / data.length) * 100).toFixed(2)}%)`);

    return {
      totalRecords: data.length,
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / data.length) * 100,
      anomalies,
      method: 'Z-Score',
      threshold: this.threshold,
    };
  }

  private getSeverity(zScore: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > threshold * 2) return 'critical';
    if (zScore > threshold * 1.5) return 'high';
    if (zScore > threshold * 1.2) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Example 2: IQR (Interquartile Range) Outlier Detection
// ============================================================================

class IQRDetector {
  constructor(private multiplier: number = 1.5) {}

  detect(data: Record[], field: string): AnomalyDetectionResult {
    console.log('='.repeat(80));
    console.log(`IQR Outlier Detection: ${field}`);
    console.log(`Multiplier: ${this.multiplier}`);
    console.log('='.repeat(80));

    const values = data
      .map(record => Number(record[field]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      throw new Error(`No numeric values found in field: ${field}`);
    }

    // Calculate quartiles
    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - this.multiplier * iqr;
    const upperBound = q3 + this.multiplier * iqr;

    console.log(`\nStatistics:`);
    console.log(`  Q1: ${q1.toFixed(2)}`);
    console.log(`  Q3: ${q3.toFixed(2)}`);
    console.log(`  IQR: ${iqr.toFixed(2)}`);
    console.log(`  Lower Bound: ${lowerBound.toFixed(2)}`);
    console.log(`  Upper Bound: ${upperBound.toFixed(2)}`);

    // Detect outliers
    const anomalies: Anomaly[] = [];

    data.forEach((record, index) => {
      const value = Number(record[field]);

      if (!isNaN(value)) {
        if (value < lowerBound || value > upperBound) {
          const distance = value < lowerBound
            ? lowerBound - value
            : value - upperBound;

          const score = distance / iqr;
          const severity = this.getSeverity(score);

          anomalies.push({
            index,
            record,
            score,
            reason: `Value ${value.toFixed(2)} outside bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
            field,
            severity,
          });
        }
      }
    });

    console.log(`\nDetected ${anomalies.length} anomalies (${((anomalies.length / data.length) * 100).toFixed(2)}%)`);

    return {
      totalRecords: data.length,
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / data.length) * 100,
      anomalies,
      method: 'IQR',
      threshold: this.multiplier,
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score > 3) return 'critical';
    if (score > 2) return 'high';
    if (score > 1) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Example 3: Time-Series Anomaly Detection
// ============================================================================

class TimeSeriesAnomalyDetector {
  constructor(
    private windowSize: number = 10,
    private threshold: number = 2
  ) {}

  detect(timeSeries: TimeSeriesPoint[]): AnomalyDetectionResult {
    console.log('='.repeat(80));
    console.log('Time-Series Anomaly Detection');
    console.log(`Window Size: ${this.windowSize}, Threshold: ${this.threshold}`);
    console.log('='.repeat(80));

    const anomalies: Anomaly[] = [];

    // Calculate moving average and standard deviation
    for (let i = this.windowSize; i < timeSeries.length; i++) {
      const window = timeSeries.slice(i - this.windowSize, i);
      const currentPoint = timeSeries[i];

      const windowValues = window.map(p => p.value);
      const mean = windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length;
      const variance = windowValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / windowValues.length;
      const stddev = Math.sqrt(variance);

      // Check if current value is anomalous
      const zScore = Math.abs((currentPoint.value - mean) / stddev);

      if (zScore > this.threshold) {
        const severity = this.getSeverity(zScore);

        anomalies.push({
          index: i,
          record: {
            timestamp: currentPoint.timestamp,
            value: currentPoint.value,
            ...currentPoint.metadata,
          },
          score: zScore,
          reason: `Time-series spike detected: value ${currentPoint.value.toFixed(2)}, expected ~${mean.toFixed(2)} ± ${stddev.toFixed(2)}`,
          severity,
        });
      }
    }

    console.log(`\nDetected ${anomalies.length} time-series anomalies`);

    return {
      totalRecords: timeSeries.length,
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / timeSeries.length) * 100,
      anomalies,
      method: 'Time-Series Moving Average',
      threshold: this.threshold,
    };
  }

  private getSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > this.threshold * 2) return 'critical';
    if (zScore > this.threshold * 1.5) return 'high';
    if (zScore > this.threshold * 1.2) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Example 4: Multivariate Anomaly Detection (Mahalanobis Distance)
// ============================================================================

class MultivariateAnomalyDetector {
  constructor(private threshold: number = 3) {}

  detect(data: Record[], fields: string[]): AnomalyDetectionResult {
    console.log('='.repeat(80));
    console.log('Multivariate Anomaly Detection');
    console.log(`Fields: ${fields.join(', ')}`);
    console.log(`Threshold: ${this.threshold}`);
    console.log('='.repeat(80));

    // Extract numeric values for specified fields
    const vectors = data.map(record =>
      fields.map(field => Number(record[field])).filter(v => !isNaN(v))
    ).filter(v => v.length === fields.length);

    if (vectors.length === 0) {
      throw new Error('No valid numeric vectors found');
    }

    // Calculate mean vector
    const means = fields.map((_, i) =>
      vectors.reduce((sum, vec) => sum + vec[i], 0) / vectors.length
    );

    console.log(`\nMean vector: [${means.map(m => m.toFixed(2)).join(', ')}]`);

    // Simplified anomaly detection using Euclidean distance
    // (Full Mahalanobis distance requires covariance matrix inversion)
    const anomalies: Anomaly[] = [];

    data.forEach((record, index) => {
      const vector = fields.map(field => Number(record[field]));

      if (vector.every(v => !isNaN(v))) {
        // Calculate Euclidean distance from mean
        const distance = Math.sqrt(
          vector.reduce((sum, v, i) => sum + Math.pow(v - means[i], 2), 0)
        );

        // Normalize by number of dimensions
        const normalizedDistance = distance / Math.sqrt(fields.length);

        if (normalizedDistance > this.threshold) {
          const severity = this.getSeverity(normalizedDistance);

          anomalies.push({
            index,
            record,
            score: normalizedDistance,
            reason: `Multivariate outlier: distance ${normalizedDistance.toFixed(2)} exceeds threshold`,
            severity,
          });
        }
      }
    });

    console.log(`\nDetected ${anomalies.length} multivariate anomalies`);

    return {
      totalRecords: data.length,
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / data.length) * 100,
      anomalies,
      method: 'Multivariate (Euclidean Distance)',
      threshold: this.threshold,
    };
  }

  private getSeverity(distance: number): 'low' | 'medium' | 'high' | 'critical' {
    if (distance > this.threshold * 2) return 'critical';
    if (distance > this.threshold * 1.5) return 'high';
    if (distance > this.threshold * 1.2) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Example 5: Pattern-based Anomaly Detection
// ============================================================================

class PatternAnomalyDetector {
  private patterns = new Map<string, number>();
  private totalCount = 0;

  train(data: Record[], field: string): void {
    console.log('='.repeat(80));
    console.log(`Training Pattern Detector on field: ${field}`);
    console.log('='.repeat(80));

    data.forEach(record => {
      const value = String(record[field] ?? '');
      const pattern = this.extractPattern(value);

      this.patterns.set(pattern, (this.patterns.get(pattern) || 0) + 1);
      this.totalCount++;
    });

    console.log(`\nLearned ${this.patterns.size} unique patterns from ${this.totalCount} records`);
    console.log('\nTop patterns:');

    Array.from(this.patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([pattern, count]) => {
        const percentage = (count / this.totalCount) * 100;
        console.log(`  "${pattern}": ${count} (${percentage.toFixed(2)}%)`);
      });
  }

  detect(data: Record[], field: string, rarityThreshold: number = 0.01): AnomalyDetectionResult {
    console.log('\n' + '='.repeat(80));
    console.log('Pattern-based Anomaly Detection');
    console.log(`Rarity Threshold: ${rarityThreshold * 100}%`);
    console.log('='.repeat(80));

    const anomalies: Anomaly[] = [];

    data.forEach((record, index) => {
      const value = String(record[field] ?? '');
      const pattern = this.extractPattern(value);
      const count = this.patterns.get(pattern) || 0;
      const frequency = count / this.totalCount;

      if (frequency < rarityThreshold) {
        const severity = this.getSeverity(frequency, rarityThreshold);

        anomalies.push({
          index,
          record,
          score: 1 - frequency,
          reason: `Rare pattern "${pattern}" (frequency: ${(frequency * 100).toFixed(4)}%)`,
          field,
          severity,
        });
      }
    });

    console.log(`\nDetected ${anomalies.length} pattern anomalies`);

    return {
      totalRecords: data.length,
      anomalyCount: anomalies.length,
      anomalyPercentage: (anomalies.length / data.length) * 100,
      anomalies,
      method: 'Pattern-based',
      threshold: rarityThreshold,
    };
  }

  private extractPattern(value: string): string {
    return value
      .replace(/[a-z]/g, 'a')
      .replace(/[A-Z]/g, 'A')
      .replace(/[0-9]/g, '9')
      .replace(/[^aA9\s-]/g, '#');
  }

  private getSeverity(frequency: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (frequency < threshold * 0.1) return 'critical';
    if (frequency < threshold * 0.3) return 'high';
    if (frequency < threshold * 0.6) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Example 6: Composite Anomaly Detector
// ============================================================================

class CompositeAnomalyDetector {
  private detectors: Array<{
    name: string;
    detector: { detect(...args: unknown[]): AnomalyDetectionResult };
    weight: number;
  }> = [];

  addDetector(
    name: string,
    detector: { detect(...args: unknown[]): AnomalyDetectionResult },
    weight: number = 1
  ): this {
    this.detectors.push({ name, detector, weight });
    return this;
  }

  combineResults(results: AnomalyDetectionResult[]): AnomalyDetectionResult {
    console.log('='.repeat(80));
    console.log('Composite Anomaly Detection');
    console.log(`Combining ${results.length} detection methods`);
    console.log('='.repeat(80));

    // Aggregate anomalies by index
    const anomalyMap = new Map<number, { count: number; totalScore: number; reasons: string[] }>();

    results.forEach((result, detectorIndex) => {
      result.anomalies.forEach(anomaly => {
        const existing = anomalyMap.get(anomaly.index);

        if (existing) {
          existing.count++;
          existing.totalScore += anomaly.score;
          existing.reasons.push(`${this.detectors[detectorIndex].name}: ${anomaly.reason}`);
        } else {
          anomalyMap.set(anomaly.index, {
            count: 1,
            totalScore: anomaly.score,
            reasons: [`${this.detectors[detectorIndex].name}: ${anomaly.reason}`],
          });
        }
      });
    });

    // Create combined anomalies (only include if detected by multiple methods)
    const combinedAnomalies: Anomaly[] = [];

    anomalyMap.forEach((data, index) => {
      if (data.count >= 2) { // Detected by at least 2 methods
        const avgScore = data.totalScore / data.count;
        const severity = this.getSeverity(data.count, this.detectors.length);

        combinedAnomalies.push({
          index,
          record: results[0].anomalies.find(a => a.index === index)?.record || {},
          score: avgScore,
          reason: `Detected by ${data.count}/${this.detectors.length} methods: ${data.reasons.join('; ')}`,
          severity,
        });
      }
    });

    console.log(`\nCombined result: ${combinedAnomalies.length} high-confidence anomalies`);

    const totalRecords = results[0]?.totalRecords || 0;

    return {
      totalRecords,
      anomalyCount: combinedAnomalies.length,
      anomalyPercentage: (combinedAnomalies.length / totalRecords) * 100,
      anomalies: combinedAnomalies,
      method: 'Composite',
    };
  }

  private getSeverity(detectionCount: number, totalDetectors: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = detectionCount / totalDetectors;
    if (ratio >= 0.8) return 'critical';
    if (ratio >= 0.6) return 'high';
    if (ratio >= 0.4) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateAnomalyDetection() {
  console.log('ANOMALY DETECTION EXAMPLES\n');

  // Sample data with anomalies
  const sampleData = [
    { id: 1, value: 100, age: 25, temperature: 20.5, pattern: 'ABC-123' },
    { id: 2, value: 105, age: 28, temperature: 21.0, pattern: 'ABC-124' },
    { id: 3, value: 98, age: 30, temperature: 20.8, pattern: 'ABC-125' },
    { id: 4, value: 102, age: 27, temperature: 21.2, pattern: 'ABC-126' },
    { id: 5, value: 500, age: 26, temperature: 20.9, pattern: 'ABC-127' }, // Anomaly: high value
    { id: 6, value: 99, age: 150, temperature: 21.1, pattern: 'ABC-128' }, // Anomaly: high age
    { id: 7, value: 101, age: 29, temperature: 50.0, pattern: 'ABC-129' }, // Anomaly: high temp
    { id: 8, value: 103, age: 25, temperature: 20.7, pattern: 'XYZ-999' }, // Anomaly: different pattern
  ];

  // Example 1: Z-Score Detection
  console.log('\n1. Z-Score Anomaly Detection:');
  console.log('-'.repeat(80));
  const zScoreDetector = new ZScoreDetector(2);
  const result1 = zScoreDetector.detect(sampleData, 'value');
  console.log(`\nAnomalies: ${result1.anomalies.length}`);
  result1.anomalies.forEach(a => console.log(`  - Record ${a.index}: ${a.reason}`));

  // Example 2: IQR Detection
  console.log('\n\n2. IQR Anomaly Detection:');
  console.log('-'.repeat(80));
  const iqrDetector = new IQRDetector(1.5);
  const result2 = iqrDetector.detect(sampleData, 'age');
  console.log(`\nAnomalies: ${result2.anomalies.length}`);
  result2.anomalies.forEach(a => console.log(`  - Record ${a.index}: ${a.reason}`));

  // Example 3: Time-Series Detection
  console.log('\n\n3. Time-Series Anomaly Detection:');
  console.log('-'.repeat(80));
  const timeSeries: TimeSeriesPoint[] = sampleData.map((record, i) => ({
    timestamp: Date.now() + i * 1000,
    value: record.temperature,
    metadata: { id: record.id },
  }));

  const tsDetector = new TimeSeriesAnomalyDetector(3, 2);
  const result3 = tsDetector.detect(timeSeries);
  console.log(`\nAnomalies: ${result3.anomalies.length}`);
  result3.anomalies.forEach(a => console.log(`  - Index ${a.index}: ${a.reason}`));

  // Example 4: Multivariate Detection
  console.log('\n\n4. Multivariate Anomaly Detection:');
  console.log('-'.repeat(80));
  const mvDetector = new MultivariateAnomalyDetector(50);
  const result4 = mvDetector.detect(sampleData, ['value', 'age', 'temperature']);
  console.log(`\nAnomalies: ${result4.anomalies.length}`);
  result4.anomalies.forEach(a => console.log(`  - Record ${a.index}: ${a.reason}`));

  // Example 5: Pattern-based Detection
  console.log('\n\n5. Pattern-based Anomaly Detection:');
  console.log('-'.repeat(80));
  const patternDetector = new PatternAnomalyDetector();
  patternDetector.train(sampleData, 'pattern');
  const result5 = patternDetector.detect(sampleData, 'pattern', 0.15);
  console.log(`\nAnomalies: ${result5.anomalies.length}`);
  result5.anomalies.forEach(a => console.log(`  - Record ${a.index}: ${a.reason}`));

  // Example 6: Composite Detection
  console.log('\n\n6. Composite Anomaly Detection:');
  console.log('-'.repeat(80));
  const compositeDetector = new CompositeAnomalyDetector();
  const compositeResult = compositeDetector.combineResults([result1, result2, result3, result4]);
  console.log(`\nHigh-confidence anomalies: ${compositeResult.anomalies.length}`);
  compositeResult.anomalies.forEach(a => {
    console.log(`\n  Record ${a.index} [${a.severity.toUpperCase()}]:`);
    console.log(`    ${a.reason}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('ANOMALY DETECTION COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateAnomalyDetection().catch(console.error);
}

export {
  ZScoreDetector,
  IQRDetector,
  TimeSeriesAnomalyDetector,
  MultivariateAnomalyDetector,
  PatternAnomalyDetector,
  CompositeAnomalyDetector,
  type AnomalyDetectionResult,
  type Anomaly,
  type TimeSeriesPoint,
};
