/**
 * Data Profiling Examples
 *
 * Demonstrates comprehensive data profiling techniques:
 * 1. Basic statistics (count, mean, median, mode, stddev)
 * 2. Data distribution analysis
 * 3. Data quality metrics (completeness, uniqueness, validity)
 * 4. Pattern detection and frequency analysis
 * 5. Data type inference
 * 6. Correlation analysis
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface DataProfile {
  datasetName: string;
  totalRecords: number;
  totalFields: number;
  fieldProfiles: Map<string, FieldProfile>;
  qualityMetrics: QualityMetrics;
  generatedAt: Date;
}

interface FieldProfile {
  fieldName: string;
  dataType: string;
  inferredTypes: Map<string, number>;
  count: number;
  nullCount: number;
  uniqueCount: number;
  distinctValues: number;
  completeness: number; // percentage
  uniqueness: number; // percentage
  statistics?: NumericStatistics;
  distribution?: Distribution;
  topValues: Array<{ value: unknown; count: number; percentage: number }>;
  patterns?: Array<{ pattern: string; count: number; example: string }>;
}

interface NumericStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number[];
  stddev: number;
  variance: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  outliers: number[];
}

interface Distribution {
  histogram: Array<{ bucket: string; count: number; percentage: number }>;
  skewness: number;
  kurtosis: number;
}

interface QualityMetrics {
  overallCompleteness: number;
  overallUniqueness: number;
  duplicateRecords: number;
  emptyRecords: number;
  dataQualityScore: number; // 0-100
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: Basic Data Profiler
// ============================================================================

class DataProfiler {
  profile(data: Record[], datasetName: string = 'Dataset'): DataProfile {
    console.log('='.repeat(80));
    console.log(`Profiling Dataset: ${datasetName}`);
    console.log(`Total Records: ${data.length}`);
    console.log('='.repeat(80));

    if (data.length === 0) {
      throw new Error('Cannot profile empty dataset');
    }

    const fields = Object.keys(data[0]);
    const fieldProfiles = new Map<string, FieldProfile>();

    console.log(`\nAnalyzing ${fields.length} fields...\n`);

    // Profile each field
    fields.forEach((field, index) => {
      console.log(`[${index + 1}/${fields.length}] Profiling field: ${field}`);
      const profile = this.profileField(field, data);
      fieldProfiles.set(field, profile);
    });

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(data, fieldProfiles);

    console.log('\n' + '='.repeat(80));
    console.log('Profiling Complete!');
    console.log('='.repeat(80));

    return {
      datasetName,
      totalRecords: data.length,
      totalFields: fields.length,
      fieldProfiles,
      qualityMetrics,
      generatedAt: new Date(),
    };
  }

  private profileField(fieldName: string, data: Record[]): FieldProfile {
    const values = data.map(record => record[fieldName]);

    // Basic counts
    const count = values.length;
    const nullCount = values.filter(v => v === null || v === undefined).length;
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const uniqueValues = new Set(nonNullValues);
    const distinctValues = uniqueValues.size;

    // Type inference
    const inferredTypes = this.inferTypes(nonNullValues);
    const dataType = this.determinePrimaryType(inferredTypes);

    // Quality metrics
    const completeness = ((count - nullCount) / count) * 100;
    const uniqueness = count > 0 ? (distinctValues / count) * 100 : 0;

    // Top values
    const topValues = this.calculateTopValues(nonNullValues, 10);

    // Numeric statistics (if applicable)
    let statistics: NumericStatistics | undefined;
    let distribution: Distribution | undefined;

    if (dataType === 'number') {
      const numericValues = nonNullValues.map(Number).filter(n => !isNaN(n));
      statistics = this.calculateNumericStatistics(numericValues);
      distribution = this.calculateDistribution(numericValues);
    }

    // Pattern detection (for strings)
    let patterns: Array<{ pattern: string; count: number; example: string }> | undefined;

    if (dataType === 'string') {
      patterns = this.detectPatterns(nonNullValues as string[]);
    }

    return {
      fieldName,
      dataType,
      inferredTypes,
      count,
      nullCount,
      uniqueCount: uniqueValues.size,
      distinctValues,
      completeness,
      uniqueness,
      statistics,
      distribution,
      topValues,
      patterns,
    };
  }

  private inferTypes(values: unknown[]): Map<string, number> {
    const typeCounts = new Map<string, number>();

    values.forEach(value => {
      let type = 'unknown';

      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'string') {
        // Try to infer more specific types
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          type = 'date';
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          type = 'email';
        } else if (/^https?:\/\//.test(value)) {
          type = 'url';
        } else if (/^\d+$/.test(value)) {
          type = 'numeric-string';
        } else {
          type = 'string';
        }
      } else if (value instanceof Date) {
        type = 'date';
      } else if (Array.isArray(value)) {
        type = 'array';
      } else if (typeof value === 'object') {
        type = 'object';
      }

      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    return typeCounts;
  }

  private determinePrimaryType(typeCounts: Map<string, number>): string {
    let maxCount = 0;
    let primaryType = 'unknown';

    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        primaryType = type;
      }
    });

    return primaryType;
  }

  private calculateTopValues(
    values: unknown[],
    limit: number
  ): Array<{ value: unknown; count: number; percentage: number }> {
    const valueCounts = new Map<unknown, number>();

    values.forEach(value => {
      const key = value;
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    });

    const sorted = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const total = values.length;

    return sorted.map(([value, count]) => ({
      value,
      count,
      percentage: (count / total) * 100,
    }));
  }

  private calculateNumericStatistics(values: number[]): NumericStatistics {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        mode: [],
        stddev: 0,
        variance: 0,
        quartiles: { q1: 0, q2: 0, q3: 0 },
        outliers: [],
      };
    }

    const sorted = [...values].sort((a, b) => a - b);

    // Basic stats
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    // Median
    const median = this.percentile(sorted, 50);

    // Mode
    const mode = this.calculateMode(values);

    // Standard deviation and variance
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stddev = Math.sqrt(variance);

    // Quartiles
    const q1 = this.percentile(sorted, 25);
    const q2 = median;
    const q3 = this.percentile(sorted, 75);

    // Outliers (using IQR method)
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);

    return {
      min,
      max,
      mean,
      median,
      mode,
      stddev,
      variance,
      quartiles: { q1, q2, q3 },
      outliers,
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;

    const index = (p / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private calculateMode(values: number[]): number[] {
    const frequencyMap = new Map<number, number>();

    values.forEach(value => {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
    });

    const maxFrequency = Math.max(...frequencyMap.values());

    return Array.from(frequencyMap.entries())
      .filter(([_, freq]) => freq === maxFrequency)
      .map(([value]) => value);
  }

  private calculateDistribution(values: number[]): Distribution {
    if (values.length === 0) {
      return {
        histogram: [],
        skewness: 0,
        kurtosis: 0,
      };
    }

    // Calculate histogram (10 bins)
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binSize = range / 10;

    const bins = Array.from({ length: 10 }, (_, i) => ({
      bucket: `${(min + i * binSize).toFixed(2)}-${(min + (i + 1) * binSize).toFixed(2)}`,
      count: 0,
      percentage: 0,
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), 9);
      bins[binIndex].count++;
    });

    bins.forEach(bin => {
      bin.percentage = (bin.count / values.length) * 100;
    });

    // Calculate skewness and kurtosis
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const n = values.length;

    const m2 = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
    const m4 = values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n;

    const skewness = m3 / Math.pow(m2, 1.5);
    const kurtosis = m4 / Math.pow(m2, 2) - 3;

    return {
      histogram: bins,
      skewness,
      kurtosis,
    };
  }

  private detectPatterns(values: string[]): Array<{ pattern: string; count: number; example: string }> {
    const patterns = new Map<string, { count: number; example: string }>();

    values.forEach(value => {
      const pattern = this.getPattern(value);
      const existing = patterns.get(pattern);

      if (existing) {
        existing.count++;
      } else {
        patterns.set(pattern, { count: 1, example: value });
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        example: data.example,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getPattern(value: string): string {
    return value
      .replace(/[a-z]/g, 'a')
      .replace(/[A-Z]/g, 'A')
      .replace(/[0-9]/g, '9')
      .replace(/[^aA9\s-]/g, '#');
  }

  private calculateQualityMetrics(
    data: Record[],
    fieldProfiles: Map<string, FieldProfile>
  ): QualityMetrics {
    // Overall completeness
    let totalCompleteness = 0;
    fieldProfiles.forEach(profile => {
      totalCompleteness += profile.completeness;
    });
    const overallCompleteness = totalCompleteness / fieldProfiles.size;

    // Overall uniqueness
    let totalUniqueness = 0;
    fieldProfiles.forEach(profile => {
      totalUniqueness += profile.uniqueness;
    });
    const overallUniqueness = totalUniqueness / fieldProfiles.size;

    // Duplicate records
    const recordStrings = data.map(r => JSON.stringify(r));
    const uniqueRecords = new Set(recordStrings).size;
    const duplicateRecords = data.length - uniqueRecords;

    // Empty records (all fields null/undefined)
    const emptyRecords = data.filter(record =>
      Object.values(record).every(v => v === null || v === undefined)
    ).length;

    // Calculate overall data quality score (0-100)
    const dataQualityScore =
      overallCompleteness * 0.4 +
      (100 - (duplicateRecords / data.length) * 100) * 0.3 +
      (100 - (emptyRecords / data.length) * 100) * 0.3;

    return {
      overallCompleteness,
      overallUniqueness,
      duplicateRecords,
      emptyRecords,
      dataQualityScore,
    };
  }
}

// ============================================================================
// Example 2: Profile Reporter
// ============================================================================

class ProfileReporter {
  generateReport(profile: DataProfile): void {
    console.log('\n' + '='.repeat(80));
    console.log(`DATA PROFILE REPORT: ${profile.datasetName}`);
    console.log('='.repeat(80));
    console.log(`Generated: ${profile.generatedAt.toISOString()}`);
    console.log(`Total Records: ${profile.totalRecords.toLocaleString()}`);
    console.log(`Total Fields: ${profile.totalFields}`);
    console.log('='.repeat(80));

    // Quality metrics
    console.log('\nDATA QUALITY METRICS:');
    console.log('-'.repeat(80));
    console.log(`Overall Completeness: ${profile.qualityMetrics.overallCompleteness.toFixed(2)}%`);
    console.log(`Overall Uniqueness: ${profile.qualityMetrics.overallUniqueness.toFixed(2)}%`);
    console.log(`Duplicate Records: ${profile.qualityMetrics.duplicateRecords}`);
    console.log(`Empty Records: ${profile.qualityMetrics.emptyRecords}`);
    console.log(`Data Quality Score: ${profile.qualityMetrics.dataQualityScore.toFixed(2)}/100`);

    // Field profiles
    console.log('\nFIELD PROFILES:');
    console.log('='.repeat(80));

    profile.fieldProfiles.forEach(fieldProfile => {
      this.printFieldProfile(fieldProfile);
    });

    console.log('\n' + '='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80));
  }

  private printFieldProfile(profile: FieldProfile): void {
    console.log(`\nField: ${profile.fieldName}`);
    console.log('-'.repeat(80));
    console.log(`Type: ${profile.dataType}`);
    console.log(`Completeness: ${profile.completeness.toFixed(2)}%`);
    console.log(`Uniqueness: ${profile.uniqueness.toFixed(2)}%`);
    console.log(`Null Count: ${profile.nullCount} (${((profile.nullCount / profile.count) * 100).toFixed(2)}%)`);
    console.log(`Distinct Values: ${profile.distinctValues}`);

    // Top values
    if (profile.topValues.length > 0) {
      console.log('\nTop Values:');
      profile.topValues.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${JSON.stringify(item.value)} - ${item.count} (${item.percentage.toFixed(2)}%)`);
      });
    }

    // Numeric statistics
    if (profile.statistics) {
      console.log('\nNumeric Statistics:');
      console.log(`  Min: ${profile.statistics.min}`);
      console.log(`  Max: ${profile.statistics.max}`);
      console.log(`  Mean: ${profile.statistics.mean.toFixed(2)}`);
      console.log(`  Median: ${profile.statistics.median.toFixed(2)}`);
      console.log(`  Std Dev: ${profile.statistics.stddev.toFixed(2)}`);
      console.log(`  Outliers: ${profile.statistics.outliers.length}`);
    }

    // Patterns
    if (profile.patterns && profile.patterns.length > 0) {
      console.log('\nPatterns:');
      profile.patterns.forEach((pattern, index) => {
        console.log(`  ${index + 1}. "${pattern.pattern}" - ${pattern.count} occurrences (e.g., "${pattern.example}")`);
      });
    }
  }
}

// ============================================================================
// Example 3: Correlation Analyzer
// ============================================================================

class CorrelationAnalyzer {
  analyzeCorrelations(data: Record[], numericFields: string[]): Map<string, Map<string, number>> {
    console.log('='.repeat(80));
    console.log('Correlation Analysis');
    console.log(`Analyzing ${numericFields.length} numeric fields`);
    console.log('='.repeat(80));

    const correlations = new Map<string, Map<string, number>>();

    for (let i = 0; i < numericFields.length; i++) {
      const field1 = numericFields[i];
      const correlationMap = new Map<string, number>();

      for (let j = 0; j < numericFields.length; j++) {
        const field2 = numericFields[j];

        if (i === j) {
          correlationMap.set(field2, 1.0);
        } else {
          const correlation = this.pearsonCorrelation(data, field1, field2);
          correlationMap.set(field2, correlation);
        }
      }

      correlations.set(field1, correlationMap);
    }

    this.printCorrelationMatrix(numericFields, correlations);

    return correlations;
  }

  private pearsonCorrelation(data: Record[], field1: string, field2: string): number {
    const pairs = data
      .map(record => ({
        x: Number(record[field1]),
        y: Number(record[field2]),
      }))
      .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

    if (pairs.length === 0) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
    const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
    const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  private printCorrelationMatrix(fields: string[], correlations: Map<string, Map<string, number>>): void {
    console.log('\nCorrelation Matrix:');
    console.log('-'.repeat(80));

    // Print header
    const maxFieldLength = Math.max(...fields.map(f => f.length));
    console.log(' '.repeat(maxFieldLength + 2) + fields.map(f => f.padEnd(8)).join(' '));

    // Print rows
    fields.forEach(field1 => {
      const row = field1.padEnd(maxFieldLength + 2);
      const values = fields.map(field2 => {
        const corr = correlations.get(field1)?.get(field2) || 0;
        return corr.toFixed(3).padEnd(8);
      }).join(' ');

      console.log(row + values);
    });
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateProfiling() {
  console.log('DATA PROFILING EXAMPLES\n');

  // Sample dataset
  const sampleData = [
    { id: 1, name: 'John Doe', age: 30, salary: 50000, department: 'Engineering', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, salary: 60000, department: 'Marketing', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, salary: 75000, department: 'Engineering', email: 'bob@example.com' },
    { id: 4, name: 'Alice Williams', age: 28, salary: 65000, department: 'Sales', email: 'alice@example.com' },
    { id: 5, name: 'Charlie Brown', age: 32, salary: 70000, department: 'Engineering', email: 'charlie@example.com' },
    { id: 6, name: 'Diana Prince', age: null, salary: 80000, department: 'Marketing', email: 'diana@example.com' },
    { id: 7, name: 'Eve Davis', age: 29, salary: 62000, department: 'Sales', email: 'eve@example.com' },
    { id: 8, name: 'Frank Miller', age: 40, salary: 90000, department: 'Engineering', email: 'frank@example.com' },
  ];

  // Example 1: Profile the dataset
  console.log('\n1. Dataset Profiling:');
  console.log('-'.repeat(80));

  const profiler = new DataProfiler();
  const profile = profiler.profile(sampleData, 'Employee Data');

  // Example 2: Generate detailed report
  console.log('\n2. Profile Report:');
  console.log('-'.repeat(80));

  const reporter = new ProfileReporter();
  reporter.generateReport(profile);

  // Example 3: Correlation analysis
  console.log('\n3. Correlation Analysis:');
  console.log('-'.repeat(80));

  const correlationAnalyzer = new CorrelationAnalyzer();
  const correlations = correlationAnalyzer.analyzeCorrelations(
    sampleData,
    ['age', 'salary']
  );

  console.log('\n' + '='.repeat(80));
  console.log('PROFILING COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateProfiling().catch(console.error);
}

export {
  DataProfiler,
  ProfileReporter,
  CorrelationAnalyzer,
  type DataProfile,
  type FieldProfile,
  type NumericStatistics,
  type Distribution,
  type QualityMetrics,
};
